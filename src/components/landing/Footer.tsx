
export function Footer() {
  return (
    <footer className="py-10 border-t mt-auto">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amiblue-400 to-amiblue-600 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">A</span>
            </div>
            <span className="font-display font-semibold">AmiPass</span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AmiPass. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
