import { PageFrame } from '@/components/PageFrame';

export default function CommunityPage(){
  return <PageFrame>
    <section className="world-page">
      <div className="world-page-head">
        <div>
          <small>MONDE ACADÉMIQUE</small>
          <h1>Communauté</h1>
          <p>Espace réservé aux échanges et au partage de ressources.</p>
        </div>
      </div>
      <div className="world-page-grid">
        <div className="world-page-card"><span>01</span><h2>Groupes d’étude</h2><p>Créer ou rejoindre des groupes par matière.</p></div>
        <div className="world-page-card"><span>02</span><h2>Ressources partagées</h2><p>Centraliser fiches, méthodes et références utiles.</p></div>
      </div>
    </section>
  </PageFrame>;
}
