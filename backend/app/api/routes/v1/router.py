from fastapi import APIRouter

from .items import router as items_router
from .login import router as login_router
from .users import router as users_router
from .utils.router import router as utils_router

router = APIRouter()
router.include_router(utils_router, prefix="/utils")
router.include_router(login_router)
router.include_router(users_router)
router.include_router(items_router)