"""
Authentication routes: signup, login, get current user
"""
from fastapi import APIRouter, HTTPException, status, Depends
import uuid

from auth.schemas import SignupRequest, LoginRequest, TokenResponse, UserResponse
from auth.utils import hash_password, verify_password, create_access_token
from auth.dependencies import get_current_user
from db.pool import db
from agent.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

import time

@router.post("/signup", response_model=TokenResponse)
async def signup(request: SignupRequest):
    """
    Create a new user account.
    Returns JWT token on successful registration.
    """
    async with db.pool.acquire() as conn:
        # Check if email already exists
        existing = await conn.fetchval(
            f"SELECT user_id FROM {settings.SCHEMA}.users WHERE email = $1",
            request.email
        )
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user
        user_id = uuid.uuid4()
        password_hash = hash_password(request.password)
        
        await conn.execute(
            f"""
            INSERT INTO {settings.SCHEMA}.users (user_id, email, password_hash, name)
            VALUES ($1, $2, $3, $4)
            """,
            user_id, request.email, password_hash, request.name
        )
    
    # Generate token
    access_token = create_access_token(data={"sub": str(user_id)})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            user_id=str(user_id),
            email=request.email,
            name=request.name
        )
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """
    Authenticate user and return JWT token.
    """
    start_time = time.time()
    async with db.pool.acquire() as conn:
        user = await conn.fetchrow(
            f"SELECT user_id, email, name, password_hash FROM {settings.SCHEMA}.users WHERE email = $1",
            request.email
        )
    end_time = time.time()
    print(f"Time taken to fetch user: {end_time - start_time} seconds")
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    start_time = time.time()
    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    end_time = time.time()
    print(f"Time taken to verify password: {end_time - start_time} seconds")
    # Generate token
    start_time = time.time()
    access_token = create_access_token(data={"sub": str(user["user_id"])})
    end_time = time.time()
    print(f"Time taken to generate token: {end_time - start_time} seconds")
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            user_id=str(user["user_id"]),
            email=user["email"],
            name=user["name"]
        )
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Get current authenticated user info.
    """
    return UserResponse(
        user_id=current_user["user_id"],
        email=current_user["email"],
        name=current_user["name"]
    )
