import React from 'react';
import { CheckCircle, Clock, Play, Pause } from 'lucide-react';

interface ProgressBarProps {
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showIcon?: boolean;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  animated?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  size = 'md',
  showLabel = true,
  showIcon = false,
  color = 'blue',
  animated = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showIcon && clampedPercentage === 100 && (
        <CheckCircle className="w-4 h-4 text-green-500" />
      )}
      
      <div className="flex-1">
        <div className={`w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden ${sizeClasses[size]}`}>
          <div
            className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full transition-all duration-300 ease-out ${
              animated ? 'animate-pulse' : ''
            }`}
            style={{ width: `${clampedPercentage}%` }}
          />
        </div>
      </div>

      {showLabel && (
        <span className={`${textSizeClasses[size]} font-medium text-neutral-700 dark:text-neutral-300 min-w-[3rem] text-right`}>
          {Math.round(clampedPercentage)}%
        </span>
      )}
    </div>
  );
};

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  backgroundColor?: string;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 60,
  strokeWidth = 4,
  showLabel = true,
  color = 'blue',
  backgroundColor = 'currentColor',
  className = ''
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  const colorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    yellow: 'text-yellow-500',
    red: 'text-red-500',
    purple: 'text-purple-500'
  };

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-neutral-200 dark:text-neutral-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-500 ease-in-out ${colorClasses[color]}`}
          strokeLinecap="round"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
            {Math.round(clampedPercentage)}%
          </span>
        </div>
      )}
    </div>
  );
};

interface LessonProgressItemProps {
  title: string;
  isCompleted: boolean;
  isActive?: boolean;
  duration?: string;
  watchTime?: string;
  quizScore?: number;
  onClick?: () => void;
  className?: string;
}

export const LessonProgressItem: React.FC<LessonProgressItemProps> = ({
  title,
  isCompleted,
  isActive = false,
  duration,
  watchTime,
  quizScore,
  onClick,
  className = ''
}) => {
  return (
    <div
      className={`flex items-center p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${
        isActive
          ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600'
          : isCompleted
          ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-600'
          : 'border-neutral-200 bg-white dark:bg-neutral-800 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
      } ${className}`}
      onClick={onClick}
    >
      {/* Status Icon */}
      <div className="flex-shrink-0 mr-3">
        {isCompleted ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : isActive ? (
          <Play className="w-5 h-5 text-blue-500" />
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-neutral-300 dark:border-neutral-600" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className={`font-medium truncate ${
          isCompleted ? 'text-green-900 dark:text-green-100' : 
          isActive ? 'text-blue-900 dark:text-blue-100' : 
          'text-neutral-900 dark:text-neutral-100'
        }`}>
          {title}
        </h4>
        
        {/* Metadata */}
        <div className="flex items-center mt-1 space-x-3 text-xs text-neutral-600 dark:text-neutral-400">
          {duration && (
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {duration}
            </div>
          )}
          {watchTime && (
            <div className="flex items-center">
              <Play className="w-3 h-3 mr-1" />
              {watchTime}
            </div>
          )}
          {quizScore !== undefined && quizScore !== null && (
            <div className="flex items-center">
              <span className="w-3 h-3 mr-1 text-yellow-500">★</span>
              {quizScore}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface VideoProgressProps {
  currentTime: number;
  duration: number;
  isPlaying?: boolean;
  onSeek?: (time: number) => void;
  className?: string;
}

export const VideoProgress: React.FC<VideoProgressProps> = ({
  currentTime,
  duration,
  isPlaying = false,
  onSeek,
  className = ''
}) => {
  const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || duration === 0) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const progressWidth = rect.width;
    const clickPercentage = clickX / progressWidth;
    const seekTime = clickPercentage * duration;
    
    onSeek(seekTime);
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Current Time */}
      <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400 min-w-[3rem]">
        {formatTime(currentTime)}
      </span>

      {/* Progress Bar */}
      <div 
        className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full cursor-pointer group"
        onClick={handleProgressClick}
      >
        <div className="relative h-full">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-150"
            style={{ width: `${percentage}%` }}
          />
          {/* Hover indicator */}
          <div className="absolute top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div 
              className="w-3 h-3 bg-blue-500 rounded-full shadow-lg"
              style={{ left: `${percentage}%`, marginLeft: '-6px' }}
            />
          </div>
        </div>
      </div>

      {/* Duration */}
      <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400 min-w-[3rem]">
        {formatTime(duration)}
      </span>

      {/* Play/Pause Indicator */}
      <div className="w-4 h-4 text-neutral-600 dark:text-neutral-400">
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </div>
    </div>
  );
};

interface QuizResultProps {
  score: number;
  totalQuestions?: number;
  correctAnswers?: number;
  attempts?: number;
  lastAttempt?: string;
  className?: string;
}

export const QuizResult: React.FC<QuizResultProps> = ({
  score,
  totalQuestions,
  correctAnswers,
  attempts,
  lastAttempt,
  className = ''
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700';
    if (score >= 60) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700';
  };

  return (
    <div className={`p-4 rounded-lg border ${getScoreBgColor(score)} ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
          Quiz Sonucu
        </h4>
        <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
          {score}%
        </div>
      </div>

      <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
        {totalQuestions && correctAnswers !== undefined && (
          <div className="flex justify-between">
            <span>Doğru Cevaplar:</span>
            <span className="font-medium">{correctAnswers}/{totalQuestions}</span>
          </div>
        )}
        
        {attempts && (
          <div className="flex justify-between">
            <span>Deneme Sayısı:</span>
            <span className="font-medium">{attempts}</span>
          </div>
        )}
        
        {lastAttempt && (
          <div className="flex justify-between">
            <span>Son Deneme:</span>
            <span className="font-medium">{new Date(lastAttempt).toLocaleDateString('tr-TR')}</span>
          </div>
        )}
      </div>

      {/* Score Bar */}
      <div className="mt-3">
        <ProgressBar 
          percentage={score} 
          size="sm" 
          color={score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red'}
          showLabel={false}
        />
      </div>
    </div>
  );
};

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  lastActivity?: string;
  className?: string;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({
  currentStreak,
  longestStreak,
  lastActivity,
  className = ''
}) => {
  return (
    <div className={`p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-700 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
          Öğrenme Serisi
        </h4>
        <div className="text-2xl">🔥</div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {currentStreak}
          </div>
          <div className="text-xs text-neutral-600 dark:text-neutral-400">
            Mevcut Seri
          </div>
        </div>
        
        <div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {longestStreak}
          </div>
          <div className="text-xs text-neutral-600 dark:text-neutral-400">
            En Uzun Seri
          </div>
        </div>
      </div>

      {lastActivity && (
        <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-700">
          <div className="text-xs text-neutral-600 dark:text-neutral-400 text-center">
            Son Aktivite: {new Date(lastActivity).toLocaleDateString('tr-TR')}
          </div>
        </div>
      )}
    </div>
  );
};

interface ActivityTimelineProps {
  activities: Array<{
    id: string;
    title: string;
    type: 'lesson_complete' | 'quiz_attempt' | 'course_start' | 'course_complete';
    timestamp: string;
    metadata?: {
      score?: number;
      watchTime?: number;
      courseName?: string;
    };
  }>;
  className?: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  className = ''
}) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lesson_complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'quiz_attempt':
        return <span className="w-4 h-4 text-yellow-500">★</span>;
      case 'course_start':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'course_complete':
        return <CheckCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-neutral-400" />;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'lesson_complete':
        return 'Ders tamamlandı';
      case 'quiz_attempt':
        return 'Quiz denendi';
      case 'course_start':
        return 'Kurs başlatıldı';
      case 'course_complete':
        return 'Kurs tamamlandı';
      default:
        return 'Aktivite';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {activities.map((activity, index) => (
        <div key={activity.id} className="flex items-start space-x-3">
          {/* Timeline indicator */}
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700">
              {getActivityIcon(activity.type)}
            </div>
            {index < activities.length - 1 && (
              <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-700 mt-2" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pb-4">
            <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {activity.title}
            </div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              {getActivityLabel(activity.type)} • {new Date(activity.timestamp).toLocaleDateString('tr-TR')}
            </div>
            
            {activity.metadata && (
              <div className="flex items-center space-x-3 mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                {activity.metadata.score && (
                  <span>Puan: {activity.metadata.score}%</span>
                )}
                {activity.metadata.watchTime && (
                  <span>Süre: {Math.round(activity.metadata.watchTime / 60)} dk</span>
                )}
                {activity.metadata.courseName && (
                  <span>{activity.metadata.courseName}</span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};