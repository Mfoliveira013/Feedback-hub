import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import EnviarFeedback from "./EnviarFeedback";

import MinhaEquipe from "./MinhaEquipe";

import Relatorios from "./Relatorios";

import Perfil from "./Perfil";

import Configuracoes from "./Configuracoes";

import CompletarPerfil from "./CompletarPerfil";

import TodosFeedbacks from "./TodosFeedbacks";

import FeedbacksRetroativos from "./FeedbacksRetroativos";

import AvaliacaoAIC from "./AvaliacaoAIC";

import TodasAvaliacoesAIC from "./TodasAvaliacoesAIC";

import AppsNef from "./AppsNef";

import DiagnosticoEmails from "./DiagnosticoEmails";

import PesquisaPeriodica from "./PesquisaPeriodica";

import ResponderPesquisa from "./ResponderPesquisa";

import ResultadosPesquisaPeriodica from "./ResultadosPesquisaPeriodica";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    EnviarFeedback: EnviarFeedback,
    
    MinhaEquipe: MinhaEquipe,
    
    Relatorios: Relatorios,
    
    Perfil: Perfil,
    
    Configuracoes: Configuracoes,
    
    CompletarPerfil: CompletarPerfil,
    
    TodosFeedbacks: TodosFeedbacks,
    
    FeedbacksRetroativos: FeedbacksRetroativos,
    
    AvaliacaoAIC: AvaliacaoAIC,
    
    TodasAvaliacoesAIC: TodasAvaliacoesAIC,
    
    AppsNef: AppsNef,
    
    DiagnosticoEmails: DiagnosticoEmails,
    
    PesquisaPeriodica: PesquisaPeriodica,
    
    ResponderPesquisa: ResponderPesquisa,
    
    ResultadosPesquisaPeriodica: ResultadosPesquisaPeriodica,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/EnviarFeedback" element={<EnviarFeedback />} />
                
                <Route path="/MinhaEquipe" element={<MinhaEquipe />} />
                
                <Route path="/Relatorios" element={<Relatorios />} />
                
                <Route path="/Perfil" element={<Perfil />} />
                
                <Route path="/Configuracoes" element={<Configuracoes />} />
                
                <Route path="/CompletarPerfil" element={<CompletarPerfil />} />
                
                <Route path="/TodosFeedbacks" element={<TodosFeedbacks />} />
                
                <Route path="/FeedbacksRetroativos" element={<FeedbacksRetroativos />} />
                
                <Route path="/AvaliacaoAIC" element={<AvaliacaoAIC />} />
                
                <Route path="/TodasAvaliacoesAIC" element={<TodasAvaliacoesAIC />} />
                
                <Route path="/AppsNef" element={<AppsNef />} />
                
                <Route path="/DiagnosticoEmails" element={<DiagnosticoEmails />} />
                
                <Route path="/PesquisaPeriodica" element={<PesquisaPeriodica />} />
                
                <Route path="/ResponderPesquisa" element={<ResponderPesquisa />} />
                
                <Route path="/ResultadosPesquisaPeriodica" element={<ResultadosPesquisaPeriodica />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}