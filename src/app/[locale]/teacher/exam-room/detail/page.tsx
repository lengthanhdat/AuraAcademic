import { Suspense } from 'react';
import ClientPage from './ClientPage';

export default function Page({ params }: any) {

  return <Suspense fallback={<div>Loading...</div>}>
      <ClientPage params={params} />
    </Suspense>;
}
