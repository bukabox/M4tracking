import React from "react";

export interface IconButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  title?: string;
}

export function IconButton({ children, title, className = "", ...rest }: IconButtonProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      title={title}
      className={`inline-flex items-center justify-center cursor-pointer select-none ${className}`}
      onKeyDown={(e) => {
        // support Enter / Space for accessibility
        if (e.key === "Enter" || e.key === " ") {
          (e.target as HTMLElement).click();
          e.preventDefault();
        }
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export default IconButton;
