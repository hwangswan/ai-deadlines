import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";

interface HeaderProps {
  onSearch: (query: string) => void;
  showEmptyMessage?: boolean;
}

const Header = ({ onSearch, showEmptyMessage = false }: HeaderProps) => {
  return (
    <header className="bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between md:h-16 py-4 md:py-0 gap-4 md:gap-0">
          <div className="flex items-center justify-center md:justify-start w-full md:w-auto gap-8">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="https://huggingface.co/front/assets/huggingface_logo.svg" 
                alt="Hugging Face Logo" 
                className="h-8 w-8"
              />
              <span className="text-2xl font-bold text-primary">
                <span className="hidden md:inline">AI Conference Deadlines</span>
                <span className="md:hidden">AI Deadlines</span>
              </span>
            </Link>
            <nav className="hidden md:flex space-x-4">
              <Link
                to="/calendar"
                className="text-neutral-600 hover:text-primary flex items-center gap-2"
              >
                <CalendarDays className="h-5 w-5" />
                Calendar
              </Link>
            </nav>
          </div>
          <div className="w-full md:max-w-lg lg:max-w-xs">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-neutral-400" />
              </div>
              <Input
                type="search"
                placeholder="Search conferences..."
                className="pl-10 w-full"
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
        {showEmptyMessage && (
          <div className="max-w-4xl mx-auto mt-2 mb-0 text-center">
            <p className="text-sm bg-amber-50 text-amber-800 py-2 px-4 rounded-md inline-block">
              There are no upcoming conferences for the selected categories - enable "Show past conferences" to see previous ones
            </p>
          </div>
        )}
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-neutral-600 py-4">
            A dỏm, yếu kém, phản cảm countdowns to <span class="line-through">top</span> CV/NLP/ML/Robotics/AI conference deadlines.
<br/>
Due to my incompetent in science, these conferences are mostly CORE B-ranked.
          </p>
          <p className="text-sm text-neutral-600 py-4">Give the original <a href="https://huggingface.co/spaces/huggingface/ai-deadlines">space</a> and <a href="https://github.com/huggingface/ai-deadlines">repository</a> a star for their awesome work!
</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
