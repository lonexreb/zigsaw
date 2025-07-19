import React, { useState, useRef, useEffect } from 'react';
import { Edit3, Eye, EyeOff, X } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { useNodeNaming } from '../../contexts/NodeNamingContext';

interface NodeNameHeaderProps {
  nodeId: string;
  originalLabel: string;
  children?: React.ReactNode;
  className?: string;
}

export function NodeNameHeader({ nodeId, originalLabel, children, className = '' }: NodeNameHeaderProps) {
  const {
    getNodeCustomName,
    setNodeCustomName,
    toggleNodeNameDisplay,
    isShowingCustomName,
    hasCustomName,
    clearNodeCustomName,
  } = useNodeNaming();

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const customName = getNodeCustomName(nodeId);
  const showingCustomName = isShowingCustomName(nodeId);
  const hasCustom = hasCustomName(nodeId);

  const displayLabel = showingCustomName && hasCustom ? customName : originalLabel;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditValue(customName);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editValue.trim()) {
      setNodeCustomName(nodeId, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditValue('');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleToggleDisplay = () => {
    if (hasCustom) {
      toggleNodeNameDisplay(nodeId);
    }
  };

  const handleClearCustomName = () => {
    clearNodeCustomName(nodeId);
    setIsEditing(false);
  };

  return (
    <div className={`flex items-center justify-between mb-3 ${className}`}>
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center space-x-1 flex-1">
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSaveEdit}
              className="h-6 text-xs bg-black/20 border-white/20 text-white placeholder:text-white/50 px-2"
              placeholder="Enter custom name..."
              maxLength={50}
            />
            <Button
              onClick={handleCancelEdit}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-white/60 hover:text-white/80 hover:bg-white/10"
            >
              <X className="w-2.5 h-2.5" />
            </Button>
          </div>
        ) : (
          <>
            <h3 className="font-bold text-lg text-white truncate">
              {displayLabel}
            </h3>
            <div className="flex items-center space-x-0.5">
              <Button
                onClick={handleStartEdit}
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 text-white/60 hover:text-white/80 hover:bg-white/10"
                title="Edit name"
              >
                <Edit3 className="w-2.5 h-2.5" />
              </Button>
              
              {hasCustom && (
                <>
                  <Button
                    onClick={handleToggleDisplay}
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0 text-white/60 hover:text-white/80 hover:bg-white/10"
                    title={showingCustomName ? "Show original name" : "Show custom name"}
                  >
                    {showingCustomName ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                  </Button>
                  
                  <Button
                    onClick={handleClearCustomName}
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0 text-white/60 hover:text-red-400 hover:bg-red-400/10"
                    title="Clear custom name"
                  >
                    <X className="w-2.5 h-2.5" />
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>
      {children && !isEditing && (
        <div className="flex items-center space-x-2 ml-2">
          {children}
        </div>
      )}
    </div>
  );
} 