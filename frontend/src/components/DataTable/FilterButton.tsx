import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  Checkbox,
  ListItemIcon,
  ListItemText,
  Badge,
  Box,
  styled,
  alpha,
} from '@mui/material';
import { FilterList, KeyboardArrowDown } from '@mui/icons-material';

export interface FilterOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface FilterButtonProps {
  label: string;
  options: FilterOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  textTransform: 'none',
  fontWeight: 600,
  transition: 'all 0.2s ease-out',
  borderWidth: '1px',
  borderColor: alpha(theme.palette.divider, 0.3),
  '&:hover': {
    borderWidth: '1px',
    borderColor: alpha(theme.palette.primary.main, 0.5),
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    transform: 'translateY(-1px)',
  },
}));

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.06),
  },
}));

export const FilterButton: React.FC<FilterButtonProps> = ({
  label,
  options,
  selectedValues,
  onChange,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleToggle = (optionId: string) => {
    const currentIndex = selectedValues.indexOf(optionId);
    const newSelected = [...selectedValues];

    if (currentIndex === -1) {
      newSelected.push(optionId);
    } else {
      newSelected.splice(currentIndex, 1);
    }

    onChange(newSelected);
  };

  const selectedCount = selectedValues.length;

  return (
    <>
      <Badge
        badgeContent={selectedCount}
        color="primary"
        invisible={selectedCount === 0}
        sx={{
          '& .MuiBadge-badge': {
            right: 8,
            top: 8,
          },
        }}
      >
        <StyledButton
          variant="outlined"
          onClick={handleClick}
          startIcon={<FilterList />}
          endIcon={<KeyboardArrowDown />}
          sx={{
            minWidth: 140,
            justifyContent: 'space-between',
          }}
        >
          {label}
        </StyledButton>
      </Badge>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 220,
            maxHeight: 400,
            boxShadow: (theme) =>
              `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`,
          },
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.id);

          return (
            <StyledMenuItem
              key={option.id}
              onClick={() => handleToggle(option.id)}
              dense
            >
              <Checkbox
                checked={isSelected}
                size="small"
                sx={{ mr: 1 }}
                disableRipple
              />
              {option.icon && (
                <ListItemIcon sx={{ minWidth: 28 }}>
                  {option.icon}
                </ListItemIcon>
              )}
              <ListItemText
                primary={option.label}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: isSelected ? 600 : 400,
                }}
              />
            </StyledMenuItem>
          );
        })}
      </Menu>
    </>
  );
};

export default FilterButton;
