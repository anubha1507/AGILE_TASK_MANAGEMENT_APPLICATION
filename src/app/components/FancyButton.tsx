import React from 'react';
import styled from '@emotion/styled';
import { Link } from 'react-router';

const FancyButton = () => {
  return (
    <StyledWrapper>
      <Link to="/signup" style={{ textDecoration: 'none' }}>
        <button className="btn">Get Started</button>
      </Link>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .btn {
   padding: 1.1em 2.5em;
   background: none;
   border: 2px solid #fff;
   font-size: 16px;
   color: #131313;
   cursor: pointer;
   position: relative;
   overflow: hidden;
   transition: all 0.3s;
   border-radius: 12px;
   background-color: #ecd448;
   font-weight: bolder;
   box-shadow: 0 4px 0 0 #000;
   display: flex;
   align-items: center;
   justify-content: center;
   min-width: 160px;
  }

  .btn:before {
   content: "";
   position: absolute;
   width: 100px;
   height: 120%;
   background-color: #ff6700;
   top: 50%;
   transform: skewX(30deg) translate(-250%, -50%);
   transition: all 0.5s;
  }

  .btn:hover {
   background-color: #4cc9f0;
   color: #fff;
   box-shadow: 0 4px 0 0 #0d3b66;
   transform: translateY(-2px);
  }

  .btn:hover::before {
   transform: skewX(30deg) translate(250%, -50%);
   transition-delay: 0.1s;
  }

  .btn:active {
   transform: scale(0.9) translateY(0);
   box-shadow: 0 2px 0 0 #0d3b66;
  }
`;

export default FancyButton;
