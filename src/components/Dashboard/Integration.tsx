import React, { useState } from 'react';
import { Code, Copy, Settings, CheckCircle2, Search, Calculator, FileText, DollarSign } from 'lucide-react';

interface WidgetConfig {
  primaryColor: string;
  // We'll let user choose left/right, but you might let them pick top/bottom as well.
  position: 'left' | 'right';
  tools: ('search' | 'points' | 'fees' | 'docs')[];
  secondaryColor?: string;
  borderRadius?: string;
}

const Integration: React.FC = () => {
  const [config, setConfig] = useState<WidgetConfig>({
    primaryColor: '#2563eb',
    position: 'right',
    tools: ['search', 'points', 'fees', 'docs'],
    secondaryColor: '#f3f4f6',
    borderRadius: '1rem'
  });
  
  const [copied, setCopied] = useState(false);
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  // Available tools configuration
  const tools = [
    { id: 'search', label: 'Occupation Search', icon: Search, description: 'Search and explore occupations' },
    { id: 'points', label: 'Points Calculator', icon: Calculator, description: 'Calculate visa points' },
    { id: 'fees', label: 'Visa Fee Calculator', icon: DollarSign, description: 'Calculate visa fees' },
    { id: 'docs', label: 'Document Checklist', icon: FileText, description: 'View required documents' }
  ];

  // Generate the widget code (script snippet)
  const generateWidgetCode = () => {
    // Make sure we include the 'tools' array as well
    const configString = JSON.stringify({
      primaryColor: config.primaryColor,
      secondaryColor: config.secondaryColor,
      borderRadius: '1rem',
      width: '300px',
      position: config.position,
      tools: config.tools
    });

    return `<!-- Occupation Search Widget -->
<script>
  window.OCCUPATION_SEARCH_CONFIG = ${configString};
</script>
<script src="${window.location.origin}/js/widget-loader.js" async></script>`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateWidgetCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleTool = (toolId: string) => {
    setConfig(prev => ({
      ...prev,
      tools: prev.tools.includes(toolId as any)
        ? prev.tools.filter(t => t !== toolId)
        : [...prev.tools, toolId as any]
    }));
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Widget Integration</h2>
          <p className="text-gray-600">Add our tools to your website</p>
        </div>
      </div>

      {/* Configuration Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Widget Configuration</h3>
        </div>

        {/* Tools Selection */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Select Tools</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tools.map(tool => {
              const Icon = tool.icon;
              const isSelected = config.tools.includes(tool.id as any);
              const isHovered = hoveredTool === tool.id;
              
              return (
                <button
                  key={tool.id}
                  onClick={() => toggleTool(tool.id)}
                  onMouseEnter={() => setHoveredTool(tool.id)}
                  onMouseLeave={() => setHoveredTool(null)}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-300
                             ${isSelected 
                               ? 'border-blue-500 bg-blue-50' 
                               : 'border-gray-200 hover:border-blue-200'}`}
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className={`p-3 rounded-lg transition-colors duration-300
                                   ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                    </div>
                    <span className="font-medium text-gray-900">{tool.label}</span>
                  </div>
                  
                  {/* Hover Description */}
                  {isHovered && (
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 
                                  bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg whitespace-nowrap">
                      {tool.description}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Position & Color */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
            <div className="flex gap-4">
              <button
                onClick={() => setConfig(prev => ({ ...prev, position: 'left' }))}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  config.position === 'left'
                    ? 'bg-blue-100 border-blue-300 text-blue-700 font-medium'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-blue-200'
                }`}
              >
                Left
              </button>
              <button
                onClick={() => setConfig(prev => ({ ...prev, position: 'right' }))}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  config.position === 'right'
                    ? 'bg-blue-100 border-blue-300 text-blue-700 font-medium'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-blue-200'
                }`}
              >
                Right
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme Color</label>
            <div className="flex gap-3">
              <input
                type="color"
                value={config.primaryColor}
                onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="h-10 w-20 rounded border border-gray-200"
              />
              <input
                type="text"
                value={config.primaryColor}
                onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="mt-8 border-t pt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Widget Preview</h3>
          <div className="bg-gray-100 p-8 rounded-xl relative min-h-[400px] overflow-hidden">
            {/* Simulated side widget */}
            <div 
              className="absolute top-1/2"
              style={{
                [config.position]: '0',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {/* The tab button */}
              <div 
                style={{ 
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed',
                  backgroundColor: config.primaryColor,
                  borderRadius: config.borderRadius,
                  color: '#fff',
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transform: config.position === 'left' 
                    ? 'translateX(-40%) rotate(180deg)' 
                    : 'translateX(40%)'
                }}
              >
                Search Tools
              </div>

              {/* The expanded panel (mock) */}
              <div 
                style={{
                  width: '300px',
                  marginLeft: config.position === 'right' ? '0.5rem' : undefined,
                  marginRight: config.position === 'left' ? '0.5rem' : undefined,
                  backgroundColor: '#fff',
                  borderRadius: config.borderRadius,
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  padding: '1rem'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Occupation Search Tools</h4>
                  <button className="text-gray-400 hover:text-gray-600" style={{ background: 'none', border: 'none' }}>
                    ×
                  </button>
                </div>
                <div className="space-y-2">
                  {config.tools.map(tool => (
                    <button 
                      key={tool}
                      className="block w-full text-left px-4 py-2 rounded hover:bg-blue-50 transition-colors text-gray-700"
                      style={{ border: 'none', background: config.secondaryColor }}
                    >
                      {tool === 'search' && 'Occupation Search'}
                      {tool === 'points' && 'Points Calculator'}
                      {tool === 'fees' && 'Visa Fees Calculator'}
                      {tool === 'docs' && 'Document Checklist'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Generation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Integration Code</h3>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Add this code to your website's HTML (e.g. inside the <code>&lt;head&gt;</code> or just before <code>&lt;/body&gt;</code>).
        </p>

        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-gray-100 text-sm">
            <code>{generateWidgetCode()}</code>
          </pre>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          <strong>Note:</strong> The widget will appear as a small vertical tab on the
          {config.position} side of the screen. Clicking it will open the tools panel.
        </p>
      </div>
    </div>
  );
};

export default Integration;