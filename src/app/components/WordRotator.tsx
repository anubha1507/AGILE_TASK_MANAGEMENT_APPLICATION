import React from 'react';
import styled from '@emotion/styled';

const WordRotator = () => {
  return (
    <StyledWrapper>
      <div className="card">
        <div className="loader">
          <p className="prefix">Manage</p>
          <div className="words">
            <span className="word">Teams</span>
            <span className="word">Projects</span>
            <span className="word">Time</span>
            <span className="word">Workflows</span>
            <span className="word">Teams</span>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  display: inline-block;
  
  .card {
    background: transparent;
    padding: 0;
  }
  
  .loader {
    font-family: "Inter", sans-serif;
    font-weight: 700;
    font-size: 32px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    letter-spacing: -0.02em;
  }

  .prefix {
    color: #666;
    transition: color 0.3s ease;
  }

  .dark .prefix {
    color: #999;
  }

  .words {
    overflow: hidden;
    position: relative;
    height: 100%;
    margin-left: 12px;
    padding-right: 2px;
  }
  
  .word {
    display: block;
    height: 100%;
    color: #3b82f6; /* Default Blue */
    animation: spin 8s cubic-bezier(0.76, 0, 0.24, 1) infinite;
    background: linear-gradient(to right, #3b82f6, #2dd4bf);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  /* Different colors for different words if desired, but gradient is nice */

  @keyframes spin {
    0%, 15% {
      transform: translateY(0);
    }
    20%, 35% {
      transform: translateY(-100%);
    }
    40%, 55% {
      transform: translateY(-200%);
    }
    60%, 75% {
      transform: translateY(-300%);
    }
    80%, 100% {
      transform: translateY(-400%);
    }
  }

  @media (max-width: 640px) {
    .loader {
      font-size: 24px;
      height: 36px;
    }
  }
`;

export default WordRotator;
