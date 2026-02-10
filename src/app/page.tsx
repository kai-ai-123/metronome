import { Metronome } from '@/components/Metronome';

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <header className="pt-8 pb-4 text-center">
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
          Metronome
        </h1>
      </header>
      <main className="flex-1 flex items-start justify-center w-full">
        <Metronome />
      </main>
    </div>
  );
}
