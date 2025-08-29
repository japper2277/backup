import React, { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { theme } from '../../styles/theme';

// Styled components for ContextMenu
const MenuContainer = styled.div`
  position: fixed;
  background: ${theme.colors.bg.surface2};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.sm} 0;
  z-index: 1000;
  box-shadow: ${theme.shadows.md};
  width: 180px;
  top: ${props => props.position?.top}px;
  left: ${props => props.position?.left}px;
  
  /* Animation */
  animation: contextMenuSlideIn 0.15s ease-out;
  
  @keyframes contextMenuSlideIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-5px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`;

const MenuItem = styled.button`
  background: none;
  border: none;
  color: ${props => props.danger ? theme.colors.accent.red : theme.colors.text.primary};
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  width: 100%;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  font-size: 0.9rem;
  transition: background-color ${theme.transitions.fast};
  
  &:hover {
    background-color: ${theme.colors.bg.surface};
  }
  
  &:focus {
    outline: none;
    background-color: ${theme.colors.bg.surface};
  }
`;

const MenuIcon = styled.i`
  width: 16px;
  text-align: center;
`;

const MenuDivider = styled.hr`
  border: none;
  border-top: 1px solid ${theme.colors.border};
  margin: ${theme.spacing.sm} 0;
`;

export const ContextMenu = ({ position, onAction, menuItems = [] }) => {
    const menuRef = useRef(null);
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onAction('close');
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onAction]);

    return (
        <MenuContainer position={position} ref={menuRef}>
            {menuItems.map((item, index) => (
                <React.Fragment key={index}>
                    {item.type === 'divider' ? (
                        <MenuDivider />
                    ) : (
                        <MenuItem 
                            danger={item.danger}
                            onClick={() => onAction(item.action)}
                        >
                            <MenuIcon className={item.icon} />
                            {item.label}
                        </MenuItem>
                    )}
                </React.Fragment>
            ))}
        </MenuContainer>
    );
};

// Pre-configured context menu for jokes
export const JokeContextMenu = ({ position, onAction }) => {
    const jokeMenuItems = [
        { action: 'cycle', icon: 'fas fa-sync-alt', label: 'Cycle Status' },
        { action: 'edit', icon: 'fas fa-pencil-alt', label: 'Edit Joke' },
        { action: 'history', icon: 'fas fa-history', label: 'View History' },
        { action: 'duplicate', icon: 'fas fa-copy', label: 'Duplicate' },
        { type: 'divider' },
        { action: 'archive', icon: 'fas fa-archive', label: 'Archive', danger: true }
    ];
    
    return (
        <ContextMenu 
            position={position}
            onAction={onAction}
            menuItems={jokeMenuItems}
        />
    );
};