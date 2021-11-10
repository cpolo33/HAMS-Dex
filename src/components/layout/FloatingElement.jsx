import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  margin: 8px;
  padding: 16px 20px;
  background: #212936;
  border-radius: 8px;
`;

export default function FloatingElement({
  style = undefined,
  children,
  stretchVertical = false,
}) {
  return (
    <Wrapper
      style={{
        height: stretchVertical ? 'calc(100% - 10px)' : undefined,
        ...style,
      }}
    >
      {children}
    </Wrapper>
  );
}
