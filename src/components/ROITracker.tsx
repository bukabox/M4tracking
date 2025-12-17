export function ROITracker() {
  return (
    <svg viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Background */}
      <rect width="400" height="240" fill="#F0FDF4" rx="12"/>
      
      {/* Header */}
      <rect x="20" y="20" width="100" height="8" rx="4" fill="#86EFAC"/>
      <rect x="20" y="35" width="70" height="6" rx="3" fill="#BBF7D0"/>
      
      {/* ROI Percentage Card */}
      <rect x="20" y="60" width="120" height="80" rx="10" fill="white" stroke="#BBF7D0" strokeWidth="1.5"/>
      <text x="80" y="85" fill="#166534" fontSize="12" fontWeight="600" textAnchor="middle">Total ROI</text>
      <text x="80" y="110" fill="#15803D" fontSize="28" fontWeight="bold" textAnchor="middle">+24.8%</text>
      <rect x="55" y="120" width="50" height="5" rx="2.5" fill="#10B981" opacity="0.3"/>
      <rect x="55" y="120" width="35" height="5" rx="2.5" fill="#10B981"/>
      
      {/* Performance Metrics */}
      <rect x="150" y="60" width="230" height="80" rx="10" fill="white" stroke="#BBF7D0" strokeWidth="1.5"/>
      
      {/* Metric 1 */}
      <circle cx="170" cy="80" r="6" fill="#10B981" opacity="0.2"/>
      <path d="M168 80h4M170 78v4" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round"/>
      <rect x="185" y="73" width="60" height="4" rx="2" fill="#E0E7FF"/>
      <rect x="185" y="82" width="40" height="5" rx="2.5" fill="#166534"/>
      
      {/* Metric 2 */}
      <circle cx="170" cy="105" r="6" fill="#3B82F6" opacity="0.2"/>
      <path d="M167 105l3-3 3 3" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <rect x="185" y="98" width="55" height="4" rx="2" fill="#E0E7FF"/>
      <rect x="185" y="107" width="38" height="5" rx="2.5" fill="#166534"/>
      
      {/* Metric 3 */}
      <circle cx="170" cy="130" r="6" fill="#F59E0B" opacity="0.2"/>
      <circle cx="170" cy="130" r="3" fill="#F59E0B"/>
      <rect x="185" y="123" width="50" height="4" rx="2" fill="#E0E7FF"/>
      <rect x="185" y="132" width="35" height="5" rx="2.5" fill="#166534"/>
      
      {/* Right side percentage */}
      <text x="365" y="82" fill="#10B981" fontSize="13" fontWeight="bold" textAnchor="end">+18.2%</text>
      <text x="365" y="107" fill="#3B82F6" fontSize="13" fontWeight="bold" textAnchor="end">+12.5%</text>
      <text x="365" y="132" fill="#F59E0B" fontSize="13" fontWeight="bold" textAnchor="end">+8.4%</text>
      
      {/* Chart Section - Investment Growth */}
      <rect x="20" y="155" width="360" height="65" rx="10" fill="white" stroke="#BBF7D0" strokeWidth="1.5"/>
      
      {/* Chart Title */}
      <text x="30" y="172" fill="#166534" fontSize="10" fontWeight="600">Portfolio Growth</text>
      
      {/* Bar Chart */}
      <rect x="30" y="185" width="25" height="25" rx="3" fill="#10B981" opacity="0.3"/>
      <rect x="30" y="197" width="25" height="13" rx="3" fill="#10B981"/>
      
      <rect x="65" y="185" width="25" height="30" rx="3" fill="#10B981" opacity="0.3"/>
      <rect x="65" y="195" width="25" height="20" rx="3" fill="#10B981"/>
      
      <rect x="100" y="185" width="25" height="28" rx="3" fill="#10B981" opacity="0.3"/>
      <rect x="100" y="194" width="25" height="19" rx="3" fill="#10B981"/>
      
      <rect x="135" y="185" width="25" height="33" rx="3" fill="#10B981" opacity="0.3"/>
      <rect x="135" y="192" width="25" height="26" rx="3" fill="#10B981"/>
      
      <rect x="170" y="185" width="25" height="35" rx="3" fill="#10B981" opacity="0.3"/>
      <rect x="170" y="188" width="25" height="32" rx="3" fill="#10B981"/>
      
      {/* Trend Line */}
      <path 
        d="M42 202 L77 195 L112 196 L147 188 L182 183" 
        stroke="#059669" 
        strokeWidth="2" 
        fill="none"
        strokeLinecap="round"
        strokeDasharray="3 3"
      />
      
      {/* Donut Chart on Right */}
      <circle cx="290" cy="192" r="22" fill="none" stroke="#E0E7FF" strokeWidth="8"/>
      <circle cx="290" cy="192" r="22" fill="none" stroke="#10B981" strokeWidth="8" strokeDasharray="90 138.23" transform="rotate(-90 290 192)"/>
      <circle cx="290" cy="192" r="22" fill="none" stroke="#3B82F6" strokeWidth="8" strokeDasharray="30 138.23" strokeDashoffset="-90" transform="rotate(-90 290 192)"/>
      <circle cx="290" cy="192" r="22" fill="none" stroke="#F59E0B" strokeWidth="8" strokeDasharray="18 138.23" strokeDashoffset="-120" transform="rotate(-90 290 192)"/>
      
      {/* Legend */}
      <circle cx="330" cy="185" r="3" fill="#10B981"/>
      <text x="338" y="188" fill="#64748B" fontSize="8">65%</text>
      <circle cx="330" cy="195" r="3" fill="#3B82F6"/>
      <text x="338" y="198" fill="#64748B" fontSize="8">22%</text>
      <circle cx="330" cy="205" r="3" fill="#F59E0B"/>
      <text x="338" y="208" fill="#64748B" fontSize="8">13%</text>
    </svg>
  );
}
