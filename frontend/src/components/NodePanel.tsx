import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scrollbars } from 'react-custom-scrollbars-2';
import { 
  Cpu, 
  Zap, 
  Bot, 
  FileText, 
  Image, 
  MessageSquare, 
  Search,
  ChevronDown,
  Plus,
  Mic,
  GitBranch,
  Calendar,
  Video,
  Repeat,
  Tag,
  Mail,
  UserCheck,
  ChevronRight,
  Layers,
  Wrench,
  Database,
  Globe} from 'lucide-react';

interface NodeType {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: {
    primary: string;
    secondary: string;
    glow: string;
  };
  category: string;
  type?: 'trigger' | 'action' | 'node' | 'tool';
}

const nodeTypes: NodeType[] = [
  // TRIGGER NODES - Event-Based
  // Removed all trigger nodes

  // ACTION NODES - Perform a Task
  // Removed all action nodes

  // NODES - Core Workflow Components
  {
    id: 'trigger',
    label: 'Trigger Node',
    description: 'Initiate workflows based on events',
    icon: <Zap className="w-5 h-5" />, 
    color: { primary: 'yellow', secondary: 'orange', glow: 'yellow-400/20' },
    category: 'Nodes'
  },
  {
    id: 'universal_agent',
    label: 'Universal Agent',
    description: 'Multi-provider AI agent with tool integration',
    icon: <Bot className="w-5 h-5" />, 
    color: { primary: 'purple', secondary: 'violet', glow: 'purple-400/20' },
    category: 'Nodes'
  },
  {
    id: 'router',
    label: 'Router Node',
    description: 'AI-powered routing for dynamic workflow paths',
    icon: <GitBranch className="w-5 h-5" />, 
    color: { primary: 'purple', secondary: 'indigo', glow: 'purple-400/20' },
    category: 'Nodes'
  },
  {
    id: 'loop',
    label: 'Loop Node',
    description: 'Repeat a sub-workflow for each item in a list',
    icon: <Repeat className="w-5 h-5" />, 
    color: { primary: 'cyan', secondary: 'blue', glow: 'cyan-400/20' },
    category: 'Nodes'
  },
  {
    id: 'document',
    label: 'Document Processor',
    description: 'Parse and process documents',
    icon: <FileText className="w-5 h-5" />, 
    color: { primary: 'orange', secondary: 'amber', glow: 'orange-400/20' },
    category: 'Nodes'
  },
  {
    id: 'groqllama',
    label: 'Groq Llama',
    description: 'Ultra-fast LLM inference',
    icon: <Cpu className="w-5 h-5" />, 
    color: { primary: 'purple', secondary: 'violet', glow: 'purple-400/20' },
    category: 'Nodes'
  },
  {
    id: 'database',
    label: 'Database Node',
    description: 'Query and manage tabular data',
    icon: <Database className="w-5 h-5" />, 
    color: { primary: 'blue', secondary: 'cyan', glow: 'blue-400/20' },
    category: 'Nodes'
  },
  {
    id: 'api_connector',
    label: 'API Connector',
    description: 'Connect to any HTTP API endpoint',
    icon: <Globe className="w-5 h-5" />, 
    color: { primary: 'cyan', secondary: 'blue', glow: 'cyan-400/20' },
    category: 'Nodes'
  },

  // TOOLS - Integrations & Utilities
  {
    id: 'gmail',
    label: 'Gmail API',
    description: 'Gmail integration and email management',
    icon: <MessageSquare className="w-5 h-5" />,
    color: { primary: 'red', secondary: 'blue', glow: 'red-400/20' },
    category: 'Tools'
  },
  {
    id: 'gmail_label_email',
    label: 'Gmail Label Email',
    description: 'Add or remove labels from emails automatically',
    icon: <Tag className="w-5 h-5" />,
    color: { primary: 'red', secondary: 'orange', glow: 'red-400/20' },
    category: 'Tools'
  },
  {
    id: 'gmail_draft_reply',
    label: 'Gmail Draft Reply',
    description: 'Create automated draft replies to emails',
    icon: <Mail className="w-5 h-5" />,
    color: { primary: 'blue', secondary: 'red', glow: 'blue-400/20' },
    category: 'Tools'
  },
  {
    id: 'google_calendar',
    label: 'Google Calendar',
    description: 'Google Calendar integration and event management',
    icon: <Calendar className="w-5 h-5" />,
    color: { primary: 'blue', secondary: 'green', glow: 'blue-400/20' },
    category: 'Tools'
  },
  {
    id: 'whisper',
    label: 'Whisper Transcription',
    description: 'AI-powered audio transcription using OpenAI Whisper',
    icon: <Mic className="w-5 h-5" />,
    color: { primary: 'purple', secondary: 'indigo', glow: 'purple-400/20' },
    category: 'Tools'
  },
  {
    id: 'imagen',
    label: 'Imagen-4 Generator',
    description: 'High-quality image generation using Google\'s Imagen-4',
    icon: <Image className="w-5 h-5" />,
    color: { primary: 'pink', secondary: 'rose', glow: 'pink-400/20' },
    category: 'Tools'
  },
  {
    id: 'veo3',
    label: 'Veo-3 Video Generator',
    description: 'Advanced text-to-video generation with Google\'s Veo-3 model via Replicate',
    icon: <Video className="w-5 h-5" />,
    color: { primary: 'orange', secondary: 'amber', glow: 'orange-400/20' },
    category: 'Tools'
  },
  {
    id: 'blip2',
    label: 'BLIP-2 Image Analyzer',
    description: 'Advanced image understanding and visual question answering using BLIP-2 via Replicate',
    icon: <Image className="w-5 h-5" />,
    color: { primary: 'purple', secondary: 'indigo', glow: 'purple-400/20' },
    category: 'Tools'
  },
  {
    id: 'human_in_loop',
    label: 'Human in Loop',
    description: 'Manual intervention and approval points',
    icon: <UserCheck className="w-5 h-5" />,
    color: { primary: 'emerald', secondary: 'green', glow: 'emerald-400/20' },
    category: 'Tools'
  },
  {
    id: 'firecrawl',
    label: 'Firecrawl Web Scraper',
    description: 'Professional web scraping and crawling with AI-powered content extraction and structured data output',
    icon: <Globe className="w-5 h-5" />,
    color: { primary: 'orange', secondary: 'amber', glow: 'orange-400/20' },
    category: 'Tools'
  }
];

const colorClasses: { [key: string]: { bg: string; text: string; ring: string } } = {
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', ring: 'ring-cyan-500/30' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', ring: 'ring-purple-500/30' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/30' },
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', ring: 'ring-indigo-500/30' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', ring: 'ring-blue-500/30' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', ring: 'ring-orange-500/30' },
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-400', ring: 'ring-pink-500/30' },
  yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', ring: 'ring-yellow-500/30' },
  slate: { bg: 'bg-slate-500/10', text: 'text-slate-400', ring: 'ring-slate-500/30' },
  red: { bg: 'bg-red-500/10', text: 'text-red-400', ring: 'ring-red-500/30' },
  black: { bg: 'bg-black/10', text: 'text-black', ring: 'ring-slate-500/30' },
};

interface NodePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  isDark?: boolean;
}

interface CategorySectionProps {
  title: string;
  icon: React.ReactNode;
  nodes: NodeType[];
  colorTheme: string;
  isOpen: boolean;
  onToggle: () => void;
  isDark: boolean;
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  title,
  icon,
  nodes,
  colorTheme,
  isOpen,
  onToggle,
  isDark,
  onDragStart
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-4"
    >
      {/* Category Header */}
      <motion.button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 group ${
          isDark 
            ? 'bg-gray-800/40 hover:bg-gray-700/60 border border-gray-700/50 hover:border-gray-600/70' 
            : 'bg-gray-100/60 hover:bg-gray-200/80 border border-gray-300/50 hover:border-gray-400/70'
        }`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center space-x-3">
          <motion.div 
            className={`p-1.5 rounded-md ${colorTheme === 'blue' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}
            whileHover={{ rotate: 5 }}
          >
            {icon}
          </motion.div>
          <div className="text-left">
            <h3 className={`font-semibold text-sm ${colorTheme === 'blue' ? 'text-blue-300' : 'text-green-300'}`}>
              {title}
            </h3>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {nodes.length} {nodes.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>
        
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className={`${isDark ? 'text-gray-400' : 'text-gray-500'} group-hover:${colorTheme === 'blue' ? 'text-blue-400' : 'text-green-400'}`}
        >
          <ChevronRight className="w-4 h-4" />
        </motion.div>
      </motion.button>

      {/* Category Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2 pl-2">
              {nodes.map((node, index) => {
                const color = colorClasses[node.color.primary] || colorClasses.slate;
                                 return (
                   <motion.div
                     key={node.id}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ duration: 0.2, delay: index * 0.05 }}
                   >
                     <div
                       draggable
                       onDragStart={(event: React.DragEvent) => onDragStart(event, node.id)}
                       className={`group relative flex items-center p-3 rounded-lg cursor-grab transition-all duration-200 border ${
                         isDark 
                           ? 'bg-gray-800/30 hover:bg-gray-700/50 border-gray-700/30 hover:border-gray-600/50' 
                           : 'bg-gray-50/60 hover:bg-gray-100/80 border-gray-200/50 hover:border-gray-300/70'
                       } hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]`}
                     >
                      {/* Node Icon */}
                      <motion.div 
                        className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${color.bg} ${color.text} border ${color.ring}`}
                        whileHover={{ rotate: 5 }}
                      >
                        {node.icon}
                      </motion.div>
                      
                      {/* Node Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {node.label}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                          {node.description}
                        </p>
                      </div>
                      
                      {/* Add Button */}
                      <motion.div 
                        className={`absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 ${color.text}`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <div className={`p-1.5 rounded-md ${color.bg} border ${color.ring}`}>
                          <Plus className="w-3 h-3" />
                        </div>
                      </motion.div>

                      {/* Drag Indicator */}
                      <div className={`absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity duration-200 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <div className="flex flex-col space-y-0.5">
                          <div className="w-1 h-1 rounded-full bg-current"></div>
                          <div className="w-1 h-1 rounded-full bg-current"></div>
                          <div className="w-1 h-1 rounded-full bg-current"></div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const NodePanel: React.FC<NodePanelProps> = ({ isOpen, onToggle, isDark = true }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [triggerExpanded, setTriggerExpanded] = useState(true);
  const [actionExpanded, setActionExpanded] = useState(true);
  const [nodesExpanded, setNodesExpanded] = useState(true);
  const [toolsExpanded, setToolsExpanded] = useState(true);

  // onDragStart should use node.id as the nodeType
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  // Split nodeTypes into categories
  const triggerNodes = nodeTypes.filter(node => node.category === 'Trigger Nodes');
  const actionNodes = nodeTypes.filter(node => node.category === 'Action Nodes');
  const nodeNodes = nodeTypes.filter(node => node.category === 'Nodes');
  const toolNodes = nodeTypes.filter(node => node.category === 'Tools');

  const filteredTriggerNodes = triggerNodes.filter(node =>
    node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredActionNodes = actionNodes.filter(node =>
    node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredNodeNodes = nodeNodes.filter(node =>
    node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredToolNodes = toolNodes.filter(node =>
    node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Custom scrollbar render functions
  const renderThumb = ({ style, ...props }: any) => {
    return (
      <div
        {...props}
        style={{
          ...style,
          backgroundColor: isDark ? 'rgba(156, 163, 175, 0.3)' : 'rgba(107, 114, 128, 0.3)',
          width: '4px',
          borderRadius: '2px',
        }}
      />
    );
  };

  const renderTrack = ({ style, ...props }: any) => {
    return (
      <div
        {...props}
        style={{
          ...style,
          backgroundColor: 'transparent',
          width: '4px',
          right: '2px',
          bottom: '2px',
          top: '2px',
          borderRadius: '2px',
        }}
      />
    );
  };

  return (
    <motion.div
      initial={{ x: -320, opacity: 0 }}
      animate={{ 
        x: isOpen ? 0 : -304, 
        opacity: isOpen ? 1 : 0.3,
        boxShadow: isOpen 
          ? isDark 
            ? '20px 0 60px rgba(0,0,0,0.4)' 
            : '20px 0 60px rgba(0,0,0,0.1)'
          : 'none'
      }}
      transition={{ 
        duration: 0.4, 
        type: "spring", 
        damping: 25,
        stiffness: 120
      }}
      className={`fixed left-0 top-0 h-full w-80 backdrop-blur-2xl border-r shadow-2xl z-40 flex flex-col ${
        isDark 
          ? 'bg-gray-900/60 border-gray-200/20 text-white' 
          : 'bg-white/60 border-gray-200/30 text-gray-900'
      }`}
    >
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 opacity-20" style={{
        background: isDark
          ? 'linear-gradient(135deg, rgba(24, 24, 27, 0.12) 0%, rgba(39, 39, 42, 0.10) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(243,244,246,0.10) 100%)',
      }}/>

      {/* Header */}
      <motion.div 
        className={`p-5 border-b relative z-10 shrink-0 ${isDark ? 'border-gray-200/20' : 'border-gray-200/30'}`}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Node Library</h2>
          </div>
          
          <motion.button
            onClick={onToggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-2 rounded-lg border transition-all duration-200 ${
              isDark 
                ? 'bg-gray-800/60 hover:bg-gray-700/80 border-gray-200/20 text-gray-300 hover:text-white' 
                : 'bg-gray-100/80 hover:bg-gray-200 border-gray-200/30 text-gray-600 hover:text-gray-900'
            }`}
          >
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </motion.button>
        </div>

        {/* Search Input */}
        <motion.div 
          className="relative"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search nodes and tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full border rounded-lg py-3 pl-10 pr-4 text-sm transition-all duration-200 focus:ring-2 focus:ring-offset-2 ${
              isDark 
                ? 'bg-gray-800/40 border-gray-200/20 text-white placeholder-gray-400 focus:ring-gray-400/30 focus:ring-offset-gray-900 focus:border-gray-400/40'
                : 'bg-white/40 border-gray-200/30 text-black placeholder-gray-500 focus:ring-gray-400/30 focus:ring-offset-white focus:border-gray-400/40'
            }`}
          />
        </motion.div>
      </motion.div>
      
      {/* Node Categories */}
      <div className="flex-1 relative">
        <Scrollbars
          renderThumbVertical={renderThumb}
          renderTrackVertical={renderTrack}
          className="absolute inset-0"
          autoHide
          autoHideTimeout={1000}
          autoHideDuration={200}
        >
          <div className="p-4 space-y-4">
            {/* Nodes Category */}
            <CategorySection
              title="Workflow Nodes"
              icon={<Layers className="w-4 h-4" />}
              nodes={filteredNodeNodes}
              colorTheme="blue"
              isOpen={nodesExpanded}
              onToggle={() => setNodesExpanded(!nodesExpanded)}
              isDark={isDark}
              onDragStart={onDragStart}
            />
            {/* Tools Category */}
            <CategorySection
              title="Integration Tools"
              icon={<Wrench className="w-4 h-4" />}
              nodes={filteredToolNodes}
              colorTheme="green"
              isOpen={toolsExpanded}
              onToggle={() => setToolsExpanded(!toolsExpanded)}
              isDark={isDark}
              onDragStart={onDragStart}
            />
            {/* Empty State */}
            {filteredNodeNodes.length === 0 && filteredToolNodes.length === 0 && searchTerm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  No items found for "{searchTerm}"
                </p>
              </motion.div>
            )}
          </div>
        </Scrollbars>
      </div>

      {/* Footer Stats */}
      <motion.div 
        className={`p-4 border-t ${isDark ? 'border-gray-700/50' : 'border-gray-300/50'} flex justify-between text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <span>{filteredNodeNodes.length} Nodes</span>
        <span>{filteredToolNodes.length} Tools</span>
      </motion.div>
    </motion.div>
  );
};

export default NodePanel;