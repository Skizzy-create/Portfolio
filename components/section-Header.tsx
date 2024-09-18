import React from 'react'

import { ReactNode } from 'react';

interface SectionHeaderProps {
    children: ReactNode;
}

export default function SectionHeader({ children }: SectionHeaderProps) {
    return (
        <h2
            className='text-3xl font-medium capitalize mb-8'
        >{children}</h2>
    )
}
