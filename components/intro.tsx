'use client'

import Image from 'next/image'
import React from 'react'
import { motion } from 'framer-motion'
import selfPotrait from '@/public/Kartik-modified.png'

export default function Intro() {
    return (
        <section className='mb-28 max-w-[50rem] text-center sm:mb-0'>
            <div className='flex items-center justify-center'>
                <div className='relative'>
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            type: 'tween',
                            duration: 0.2
                        }}
                    >
                        <Image src={selfPotrait}
                            alt="Kartik Aslia"
                            width="192"
                            height="192"
                            priority={true}
                            quality="95"
                            className=' object-cover h-24 w-24 rounded-full border-[0.35rem] border-white shadow-xl'
                        />
                    </motion.div>
                    <motion.span className='absolute bottom-0 right-0 text-4xl'
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            type: 'spring',
                            stiffness: 125,
                            delay: 0.1,
                            duration: 0.7
                        }}
                    >
                        👋
                    </motion.span>
                </div>
            </div>
            <p className='mb-10 mt-4 px-4 text-2xl font-medium !leading-[1.5] sm:text-4xl'>
                <span className="font-bold">Hey, I’m Kartik Aslia</span>, a{" "}
                <span className="font-bold">Machine Learning Engineer</span> and{" "}
                <span className="font-bold">Backend Developer</span> with a knack for{" "}
                <span className="font-bold">solving real-world problems</span>.
                <br />
                😎🚀
                <br />
                Currently building{" "}
                <span className="underline font-bold">MyEncrypt</span>!

            </p>
        </section>
    )
}
