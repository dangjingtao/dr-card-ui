export default function Button({children,className='',...props}){return <button className={`rounded-full px-5 py-2 bg-gold text-white ${className}`} {...props}>{children}</button>}
