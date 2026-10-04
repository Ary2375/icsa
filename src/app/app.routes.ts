import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { Methodology } from './pages/methodology/methodology';
import { Artifacts } from './pages/artifacts/artifacts';

export const routes: Routes = [
    {
        path: "artifacts",
        component: Artifacts
    },
    {
        path: "methodology",
        component: Methodology
    },
    {
        path: "",
        component: Dashboard
    }
];
