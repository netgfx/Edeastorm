/** @format */

"use client";

import { ReactNode } from "react";
import flagsmith from "flagsmith";
import { FlagsmithProvider as Provider } from "flagsmith/react";

interface FlagsmithProviderProps {
  children: ReactNode;
  environmentID: string;
}

export function FlagsmithProvider({
  children,
  environmentID,
}: FlagsmithProviderProps) {
  return (
    <Provider
      flagsmith={flagsmith}
      options={{
        environmentID: environmentID,
      }}
    >
      {children}
    </Provider>
  );
}
