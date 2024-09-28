'use client'

import { links } from '@/lib/data';
import React, { createContext, useContext, useState } from 'react'

type SectionName = typeof links[number]['name'];

type SectionNameProps = {
    children: React.ReactNode;
};

type ActiveSectionContextType = {
    activeSection: SectionName;
    setActiveSection: React.Dispatch<React.SetStateAction<SectionName>>;
}

export const ActiveSectionContext = createContext<ActiveSectionContextType | null>(null);

export default function ActiveSectionContextProvider({ children }: SectionNameProps) {
    const [activeSection, setActiveSection] = useState<SectionName>('Home');
    return (
        <ActiveSectionContext.Provider
            value={{
                activeSection,
                setActiveSection
            }}
        >
            {children}
        </ActiveSectionContext.Provider>
    )
};

export function useActiveSectionContext() {
    const context = useContext(ActiveSectionContext);

    if (context === null) {
        throw new Error(
            'useActiveSectionContext must be used within an ActiveSectionContextProvider'
        );
    }

    return context;
}