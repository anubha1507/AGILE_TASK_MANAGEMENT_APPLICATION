import React from 'react';
import styled from '@emotion/styled';
import { Link } from 'react-router';

const LoginButton = () => {
  return (
    <StyledWrapper>
      <Link to="/login" style={{ textDecoration: 'none' }}>
        <button className="btn-login">
          <span>Log in</span>
        </button>
      </Link>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .btn-login {
    outline: none;
    cursor: pointer;
    border: none;
    padding: 0.6rem 2rem;
    margin: 0;
    font-family: inherit;
    font-size: 0.875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    position: relative;
    display: inline-block;
    border-radius: 99rem;
    overflow: hidden;
    background: transparent;
    transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
    
    /* Light Mode Default */
    color: #111;
    border: 1px solid #e5e7eb;
  }

  /* Dark Mode */
  .dark & .btn-login,
  [data-theme='dark'] & .btn-login {
    color: #fff;
    border-color: #333;
  }

  .btn-login span {
    position: relative;
    z-index: 1;
    transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .btn-login::before {
    content: "";
    position: absolute;
    inset: 0;
    margin: auto;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    scale: 0;
    z-index: 0;
    background-color: #111;
    transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .dark & .btn-login::before,
  [data-theme='dark'] & .btn-login::before {
    background-color: #fff;
  }

  .btn-login:hover {
    color: #fff;
    border-color: #111;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }

  .dark & .btn-login:hover,
  [data-theme='dark'] & .btn-login:hover {
    color: #111;
    border-color: #fff;
    box-shadow: 0 10px 20px rgba(255, 255, 255, 0.05);
  }

  .btn-login:hover::before {
    scale: 1.1;
  }

  .btn-login:active {
    scale: 0.95;
  }
`;

export default LoginButton;
