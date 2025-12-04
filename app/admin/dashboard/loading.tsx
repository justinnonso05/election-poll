export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center space-y-6">
        {/* Triple dot spinner */}
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce delay-50"></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce delay-100"></div>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">Loading Dashboard...</h2>
        </div>
      </div>
    </div>
  );
}
