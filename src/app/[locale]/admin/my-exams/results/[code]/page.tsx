import ClientPage from './ClientPage';

export function generateStaticParams() {
  return [{ code: 'default' }];
}

export default function Page({ params }: any) {
  return <ClientPage params={params} />;
}
