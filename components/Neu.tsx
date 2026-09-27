'use client';
import type { ButtonHTMLAttributes, HTMLAttributes } from 'react';

export function NeuCard({className='',...props}:HTMLAttributes<HTMLDivElement>) {return <div className={`neu-card ${className}`} {...props}/>}
export function SoftCard({className='',...props}:HTMLAttributes<HTMLDivElement>) {return <div className={`soft-card ${className}`} {...props}/>}
export function GoldButton({className='',children,...props}:ButtonHTMLAttributes<HTMLButtonElement>) {return <button className={`gold-button ${className}`} {...props}>{children}</button>}
export function NeuButton({className='',children,...props}:ButtonHTMLAttributes<HTMLButtonElement>) {return <button className={`neu-button ${className}`} {...props}>{children}</button>}
