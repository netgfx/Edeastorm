import React from "react";
import StickyCanvas from "./StickyCanvas";

type GridCanvasComponent = {
  OuterChildren: React.FC<{ children: React.ReactNode }>;
  InnerChildren: React.FC<{ children: React.ReactNode }>;
} & React.FC<{ children: React.ReactNode }>;

// Define the container components
const OuterElements = ({ children }: { children: React.ReactNode }) => {
  return <div className="outer-elements">{children}</div>;
};

// Components for collecting children
export const OuterChildren = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const InnerChildren = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Main component
const GridCanvasRoot = ({ children }: { children: React.ReactNode }) => {
  // Find the children of each type
  let outerChildren: React.ReactNode | null = null;
  let innerChildren: React.ReactNode | null = null;

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      if (child.type === OuterChildren) {
        outerChildren = child.props.children;
      } else if (child.type === InnerChildren) {
        innerChildren = child.props.children;
      }
    }
  });

  return (
    <>
      <OuterElements>{outerChildren}</OuterElements>
      <StickyCanvas>{innerChildren}</StickyCanvas>
    </>
  );
};

// Compose the final component with its sub-components
export const GridCanvas = Object.assign(GridCanvasRoot, {
  OuterChildren,
  InnerChildren,
});
