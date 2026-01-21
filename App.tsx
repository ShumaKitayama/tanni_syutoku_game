import React, { useState, useEffect } from 'react';
import { GameScene } from './components/GameScene';
import { GameStatus } from './types';
import { GraduationCap, AlertTriangle, RefreshCw, Trophy, MousePointer2, Frown, Zap } from 'lucide-react';

// Kusoge Elements: Funny Ranks
const getRank = (score: number) => {
  if (score < 10) return "ピカピカの1年生";
  if (score < 30) return "慣れてきた2年生";
  if (score < 60) return "レポートに追われる3年生";
  if (score < 100) return "悟りを開いた4年生";
  if (score < 120) return "え！内定先あるのに卒業単位が1単位だけ足りない？！5年生"
  if (score < 150) return "伝説の留年王";
  return "単位の神 (GOD)";
};

// Kusoge Elements: Random Excuses
const EXCUSES = [
  "目覚まし時計が壊れました",
  "電車が遅延しました（嘘）",
  "教授の滑舌が悪すぎました",
  "レポートの提出先を間違えました",
  "前日に飲みすぎました",
  "人生という名の授業に出席していました",
  "布団が離してくれませんでした",
  "なぜか教室に入れませんでした",
  "モラトリアムを恐れた計画的留年ですね",
  "勉強時間よりもバイトを優先しすぎました",
  "出席確認代行がバレました"
];

const App = () => {
  const [gameState, setGameState] = useState<GameStatus>(GameStatus.START);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [excuse, setExcuse] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem('tani_rush_highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const handleStart = () => {
    setScore(0);
    setGameState(GameStatus.PLAYING);
  };

  const handleGameOver = () => {
    if (gameState === GameStatus.GAME_OVER) return;
    setGameState(GameStatus.GAME_OVER);
    setExcuse(EXCUSES[Math.floor(Math.random() * EXCUSES.length)]);
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('tani_rush_highscore', score.toString());
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans select-none text-white bg-[#1a3c34]">
      
      {/* 3D Scene Layer */}
      <GameScene 
        status={gameState} 
        onScore={setScore} 
        onGameOver={handleGameOver} 
      />

      {/* HUD Layer */}
      <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-start pointer-events-none z-10">
        <div className="flex flex-col gap-2 animate-in slide-in-from-top duration-500">
          <div className="flex flex-col items-start bg-black/60 backdrop-blur-md p-4 rounded-xl border-2 border-yellow-400 shadow-[4px_4px_0px_0px_rgba(250,204,21,1)]">
            <span className="text-xs text-yellow-200 font-bold tracking-widest uppercase">Collected Units</span>
            <div className="text-6xl font-black text-white font-mono leading-none mt-1 drop-shadow-md">
              {score}
            </div>
            <div className="mt-2 px-2 py-1 bg-yellow-500 text-black text-xs font-black rounded transform -rotate-2">
              {getRank(score)}
            </div>
            <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <Trophy size={12} /> BEST: {highScore}
            </div>
          </div>
        </div>
        
        {/* Status Indicator - Flashing ridiculously */}
        {gameState === GameStatus.PLAYING && (
          <div className="animate-bounce flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-red-500 font-black bg-black/80 px-4 py-2 rounded-lg border-2 border-red-500 shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]">
              <AlertTriangle size={24} className="fill-current animate-pulse" />
              <span className="tracking-widest text-xl">フル単必須！</span>
            </div>
            {score > 50 && (
              <div className="text-red-500 font-black text-4xl animate-pulse transform rotate-12 drop-shadow-lg">
                ヤバイ！
              </div>
            )}
          </div>
        )}
      </div>

      {/* Start Screen Overlay */}
      {gameState === GameStatus.START && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#1a3c34]/95 backdrop-blur-sm">
          <div className="text-center space-y-8 max-w-lg p-8 border-4 border-yellow-400 rounded-3xl bg-black/50 shadow-[10px_10px_0px_0px_rgba(250,204,21,0.5)] transform hover:scale-105 transition-transform duration-300">
            <div className="flex justify-center relative">
              <div className="bg-yellow-400/20 p-6 rounded-full animate-spin-slow">
                <GraduationCap size={100} className="text-yellow-400" />
              </div>
              <div className="absolute -top-4 -right-4 bg-red-500 text-white font-bold px-3 py-1 rounded-full transform rotate-12 animate-pulse">
                留年率99%
              </div>
            </div>
            
            <div>
              <h1 className="text-7xl font-black text-white tracking-tighter mb-2 drop-shadow-[4px_4px_0_#000]">
                単位回収<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">RUSH!</span>
              </h1>
              <p className="text-gray-200 text-lg font-bold mt-4 bg-red-600/40 inline-block px-4 py-2 rounded transform -rotate-1">
                落単 ＝ 即死 (Game Over)
              </p>
            </div>
            
            <button 
              onClick={handleStart}
              className="group relative w-full py-6 px-8 bg-yellow-400 text-black font-black text-3xl rounded-xl border-b-8 border-yellow-600 hover:border-yellow-700 hover:translate-y-1 active:border-b-0 active:translate-y-2 transition-all shadow-xl"
            >
              <span className="flex items-center justify-center gap-2">
                <Zap className="fill-current" />
                履修登録 (PLAY)
              </span>
            </button>
          </div>
          <div className="mt-8 text-white/50 text-sm animate-pulse">
             マウスを動かして単位を拾え！
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState === GameStatus.GAME_OVER && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-red-900/90 backdrop-blur-md animate-in zoom-in-90 duration-300">
           <div className="text-center space-y-6 max-w-xl p-10 border-8 border-black rounded-sm bg-white text-black shadow-[20px_20px_0px_0px_rgba(0,0,0,0.5)] transform rotate-1">
            
            <div className="relative">
                <h2 className="text-8xl font-black text-red-600 tracking-tighter drop-shadow-sm">
                留 年
                </h2>
                <div className="absolute top-0 right-0 transform translate-x-10 -translate-y-10 rotate-12">
                     <Frown size={80} className="text-black" strokeWidth={3} />
                </div>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-300 font-bold text-left">
                <div className="text-xs text-gray-500 mb-1">留年の理由:</div>
                <div className="text-xl text-black">{excuse}</div>
            </div>

            <div className="flex flex-col items-center gap-1 py-4 border-y-4 border-double border-gray-300">
              <span className="text-sm text-gray-500 font-bold">最終学歴（スコア）</span>
              <span className="text-7xl font-mono font-black text-black">{score}</span>
              <span className="text-red-500 font-bold text-xl">{getRank(score)}</span>
            </div>

            <button 
              onClick={handleStart}
              className="flex items-center justify-center gap-3 w-full py-5 px-8 bg-black text-white font-black text-2xl rounded hover:bg-gray-800 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
            >
              <RefreshCw size={28} className="stroke-[3px]" />
              再履修申請 (RETRY)
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
