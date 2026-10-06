from fastapi import APIRouter, HTTPException, UploadFile, File
from services.analysis import analyze_crop, analyze_pest
import tempfile, os

router = APIRouter()

async def _analyze_upload(file: UploadFile, kind: str):
    suffix = '.jpg'
    name = (file.filename or '').lower()
    if name.endswith('.png'): suffix = '.png'
    elif name.endswith('.jpeg'): suffix = '.jpeg'
    try:
        data = await file.read()
        if not data:
            raise HTTPException(400, 'Empty file uploaded')
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(data)
            image_path = tmp.name
        try:
            return analyze_crop(image_path) if kind == 'crop' else analyze_pest(image_path)
        finally:
            try: os.unlink(image_path)
            except OSError: pass
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f'Analysis failed: {e}')

@router.post('/crop')
async def crop_analyze(file: UploadFile = File(...)):
    return await _analyze_upload(file, 'crop')

@router.post('/pest')
async def pest_analyze(file: UploadFile = File(...)):
    return await _analyze_upload(file, 'pest')
