'use client'

import Image from 'next/image'
import React from 'react'
import { motion } from 'framer-motion'
import selfPotrait from '@/public/Kartik-modified.png'
import Link from 'next/link'
import { BsArrowRight, BsGithub, BsLinkedin } from 'react-icons/bs'
import { HiDownload } from 'react-icons/hi'
import { useSectionInView } from '@/lib/hooks'

export default function Intro() {
    const { ref } = useSectionInView("Home", 0.5);
    return (
        <section ref={ref} id='home' className='mb-28 max-w-[50rem] text-center sm:mb-0 scroll-mt-[100rem]'>
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

            <motion.h1 className='mb-10 mt-4 px-4 text-2xl font-medium !leading-[1.5] sm:text-4xl'
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <span className="font-bold">Hey, I’m Kartik Aslia</span>, a{" "}
                <span className="font-bold">Machine Learning Engineer</span> and{" "}
                <span className="font-bold">Backend Developer</span> with a knack for{" "}
                <span className="font-bold">solving real-world problems</span>.
                <br />
                😎🚀
                <br />
                Currently building{" "}
                <span className="underline font-bold">MyEncrypt</span>!
            </motion.h1>

            <motion.div
                className='flex flex-col sm:flex-row items-center justify-center gap-2 px-4 text-lg font-medium'
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    delay: 0.1
                }}
            >
                <Link
                    href="#contact"
                    className="group bg-gray-900 text-white px-7 py-3 flex items-center gap-2 rounded-full outline-none focus:scale-110 shadow-md hover:scale-110 hover:bg-gray-950 active:scale-105 transition"
                >
                    Contact me here <BsArrowRight
                        className=' opacity-70 group-hover:translate-x-2 transition' />
                </Link>

                <a className='group bg-white px-7 py-3 flex items-center gap-2 rounded-full outline-none focus:scale-110 hover:scale-110 active:scale-105 transition cursor-pointer border border-black/10 shadow-md' href='/Kartik Aslia CV.pdf' download={true}>
                    Download CV <HiDownload
                        className='opacity- group-hover:translate-y-1 transition'
                    />
                </a>

                <a className='bg-white p-4 text-gray-700 flex items-center gap-2 rounded-full outline-none focus:scale-[1.15] hover:scale-[1.15] active:scale-105 transition cursor-pointer hover:text-gray-950 shadow-md border border-black/10' href='https://www.linkedin.com/in/kartik-aslia-1406b0248/' target='_blank'>
                    <BsLinkedin />
                </a>

                <a className='bg-white p-4 text-gray-700 flex items-center gap-2 rounded-full outline-none focus:scale-[1.15] hover:scale-[1.15] active:scale-105 transition cursor-pointer hover:text-gray-950 shadow-mdborder border-black/10' href='https://github.com/Skizzy-create' target='_blank'>
                    <BsGithub />
                </a>

            </motion.div>


        </section>
    )
}
