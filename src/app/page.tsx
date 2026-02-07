'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PlannerContainer } from '@/components/PlannerContainer';

export default function Home() {
  return (
    <ErrorBoundary>
      <PlannerContainer />
    </ErrorBoundary>
  );
}
