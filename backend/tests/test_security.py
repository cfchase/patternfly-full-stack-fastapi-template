"""
Tests for core security module (password hashing and JWT tokens).
"""
from datetime import timedelta

import pytest
from jose import jwt
from jose.exceptions import JWTError

from app.core.config import settings
from app.core.security import (
    ALGORITHM,
    create_access_token,
    get_password_hash,
    verify_password,
)


class TestPasswordHashing:
    """Test password hashing and verification."""

    def test_hash_password(self):
        """Test password hashing."""
        password = "testpassword123"
        hashed = get_password_hash(password)

        # Hash should be different from original password
        assert hashed != password
        # Hash should be a non-empty string
        assert isinstance(hashed, str)
        assert len(hashed) > 0

    def test_verify_password_success(self):
        """Test password verification with correct password."""
        password = "testpassword123"
        hashed = get_password_hash(password)

        # Verification should succeed with correct password
        assert verify_password(password, hashed) is True

    def test_verify_password_failure(self):
        """Test password verification with incorrect password."""
        password = "testpassword123"
        wrong_password = "wrongpassword456"
        hashed = get_password_hash(password)

        # Verification should fail with wrong password
        assert verify_password(wrong_password, hashed) is False

    def test_hash_produces_different_results(self):
        """Test that hashing same password twice produces different hashes."""
        password = "testpassword123"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        # Each hash should be different due to salt
        assert hash1 != hash2
        # But both should verify correctly
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True

    def test_password_case_sensitive(self):
        """Test that password verification is case-sensitive."""
        password = "TestPassword123"
        hashed = get_password_hash(password)

        # Exact match should work
        assert verify_password("TestPassword123", hashed) is True
        # Different case should fail
        assert verify_password("testpassword123", hashed) is False
        assert verify_password("TESTPASSWORD123", hashed) is False


class TestJWTTokens:
    """Test JWT token creation and verification."""

    def test_create_access_token(self):
        """Test JWT token creation."""
        user_id = "123e4567-e89b-12d3-a456-426614174000"
        token = create_access_token(user_id)

        # Token should be a non-empty string
        assert isinstance(token, str)
        assert len(token) > 0

    def test_decode_access_token(self):
        """Test JWT token decoding."""
        user_id = "123e4567-e89b-12d3-a456-426614174000"
        token = create_access_token(user_id)

        # Decode token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])

        # Verify payload contains correct subject
        assert payload["sub"] == user_id
        # Verify payload contains expiration
        assert "exp" in payload

    def test_token_with_custom_expiration(self):
        """Test JWT token with custom expiration time."""
        user_id = "123e4567-e89b-12d3-a456-426614174000"
        expires_delta = timedelta(minutes=30)
        token = create_access_token(user_id, expires_delta=expires_delta)

        # Decode and verify token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == user_id

    def test_token_with_different_subjects(self):
        """Test that tokens for different users are different."""
        user_id_1 = "123e4567-e89b-12d3-a456-426614174000"
        user_id_2 = "987e6543-e21b-32d1-a654-426614174999"

        token_1 = create_access_token(user_id_1)
        token_2 = create_access_token(user_id_2)

        # Tokens should be different
        assert token_1 != token_2

        # Decode and verify subjects
        payload_1 = jwt.decode(token_1, settings.SECRET_KEY, algorithms=[ALGORITHM])
        payload_2 = jwt.decode(token_2, settings.SECRET_KEY, algorithms=[ALGORITHM])
        assert payload_1["sub"] == user_id_1
        assert payload_2["sub"] == user_id_2

    def test_invalid_token_decode(self):
        """Test that invalid tokens raise error."""
        invalid_token = "invalid.token.here"

        with pytest.raises(JWTError):
            jwt.decode(invalid_token, settings.SECRET_KEY, algorithms=[ALGORITHM])

    def test_token_with_wrong_secret(self):
        """Test that token verification fails with wrong secret."""
        user_id = "123e4567-e89b-12d3-a456-426614174000"
        token = create_access_token(user_id)
        wrong_secret = "wrong_secret_key"

        with pytest.raises(JWTError):
            jwt.decode(token, wrong_secret, algorithms=[ALGORITHM])

    def test_token_subject_types(self):
        """Test token creation with different subject types."""
        # Test with string
        token_str = create_access_token("user123")
        payload_str = jwt.decode(token_str, settings.SECRET_KEY, algorithms=[ALGORITHM])
        assert payload_str["sub"] == "user123"

        # Test with integer (should be converted to string)
        token_int = create_access_token(12345)
        payload_int = jwt.decode(token_int, settings.SECRET_KEY, algorithms=[ALGORITHM])
        assert payload_int["sub"] == "12345"
