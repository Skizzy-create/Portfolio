'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function SectionDivider() {
    return (
        <motion.div
            className='my-24 h-16 w-1 rounded-full hidden sm:block'
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'linear-gradient(180deg, #f8cdda, #f8cdda)',
                perspective: '1000px',
                transformStyle: 'preserve-3d',
            }}
            transition={{
                delay: 0.125,
            }}
            whileHover={{
                background: 'linear-gradient(180deg, #f8cdda, #f8cdda, #f8cdda)',
                backgroundSize: '200% 200%',
                backgroundPosition: ['0% 50%', '100% 50%'],
                scale: [1, 1.2, 1.1],
                rotate: [0, 10, -10, 0],
                x: [0, -10, 10, 0],
                boxShadow: '0px 0px 8px rgba(0, 0, 0, 0.2)',
                transition: {
                    type: 'spring',
                    stiffness: 200,
                    damping: 10,
                    backgroundPosition: { duration: 3, ease: 'easeInOut', repeat: Infinity },
                },
            }}
        >
        </motion.div>
    );
}
