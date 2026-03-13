import AppsNef from './pages/AppsNef';
import AvaliacaoAIC from './pages/AvaliacaoAIC';
import CompletarPerfil from './pages/CompletarPerfil';
import Configuracoes from './pages/Configuracoes';
import Dashboard from './pages/Dashboard';
import DiagnosticoEmails from './pages/DiagnosticoEmails';
import EnviarFeedback from './pages/EnviarFeedback';
import FeedbacksRetroativos from './pages/FeedbacksRetroativos';
import Home from './pages/Home';
import ImportacaoRelatorios from './pages/ImportacaoRelatorios';
import MinhaEquipe from './pages/MinhaEquipe';
import Perfil from './pages/Perfil';
import PesquisaPeriodica from './pages/PesquisaPeriodica';
import Relatorios from './pages/Relatorios';
import ResponderPesquisa from './pages/ResponderPesquisa';
import ResultadosPesquisaPeriodica from './pages/ResultadosPesquisaPeriodica';
import TodasAvaliacoesAIC from './pages/TodasAvaliacoesAIC';
import TodosFeedbacks from './pages/TodosFeedbacks';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AppsNef": AppsNef,
    "AvaliacaoAIC": AvaliacaoAIC,
    "CompletarPerfil": CompletarPerfil,
    "Configuracoes": Configuracoes,
    "Dashboard": Dashboard,
    "DiagnosticoEmails": DiagnosticoEmails,
    "EnviarFeedback": EnviarFeedback,
    "FeedbacksRetroativos": FeedbacksRetroativos,
    "Home": Home,
    "ImportacaoRelatorios": ImportacaoRelatorios,
    "MinhaEquipe": MinhaEquipe,
    "Perfil": Perfil,
    "PesquisaPeriodica": PesquisaPeriodica,
    "Relatorios": Relatorios,
    "ResponderPesquisa": ResponderPesquisa,
    "ResultadosPesquisaPeriodica": ResultadosPesquisaPeriodica,
    "TodasAvaliacoesAIC": TodasAvaliacoesAIC,
    "TodosFeedbacks": TodosFeedbacks,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
