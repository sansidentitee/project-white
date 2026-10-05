import { ArrowRight, Construction, type LucideIcon } from 'lucide-react';
import { PageFrame } from './PageFrame';

export function UniverseComingSoon({name,icon:Icon,description}:{name:string;icon:LucideIcon;description:string}){
  return <PageFrame>
    <div className="universe-coming">
      <div className="coming-orb"><Icon size={26}/></div>
      <span className="label">PROJECT WHITE · UNIVERS</span>
      <h1>{name}</h1>
      <p>{description}</p>
      <div className="coming-status"><Construction size={16}/><span>Structure installée</span><ArrowRight size={15}/><b>développement à la prochaine étape</b></div>
    </div>
  </PageFrame>;
}
