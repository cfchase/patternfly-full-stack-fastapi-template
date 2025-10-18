from fastapi import APIRouter
from .utils.router import router as utils_router
from .items import router as items_router

router = APIRouter()
router.include_router(utils_router, prefix="/utils")
router.include_router(items_router)