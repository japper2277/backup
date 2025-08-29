import React from 'react';
import styled from '@emotion/styled';
import { theme } from '../../styles/theme';

// Styled components using Emotion
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  
  /* Animation */
  opacity: ${props => props.isOpen ? 1 : 0};
  transition: opacity ${theme.transitions.normal};
  pointer-events: ${props => props.isOpen ? 'auto' : 'none'};
`;

const ModalContent = styled.div`
  background: ${theme.colors.bg.surface2};
  padding: ${theme.spacing.xxl};
  border-radius: ${theme.borderRadius.xl};
  width: 90%;
  max-width: 500px;
  box-shadow: ${theme.shadows.lg};
  
  /* Animation */
  transform: ${props => props.isOpen ? 'scale(1)' : 'scale(0.95)'};
  transition: transform ${theme.transitions.normal};
`;

export const Modal = ({ isOpen, onClose, children }) => {
    return (
        <ModalOverlay isOpen={isOpen} onClick={onClose}>
            <ModalContent isOpen={isOpen} onClick={e => e.stopPropagation()}>
                {children}
            </ModalContent>
        </ModalOverlay>
    );
};