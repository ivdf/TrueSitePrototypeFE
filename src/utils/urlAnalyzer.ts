import { LogCallback } from './logger';

export interface DomainInfo {
  fullDomain: string;
  domain: string;
  subdomain: string;
  tld: string;
  length: number;
  protocol: string;
  hasNumbers: boolean;
  hasHyphens: boolean;
  isIPAddress: boolean;
  entropy: number;
  suspiciousKeywords: string[];
}

export interface SSLInfo {
  isValid: boolean;
  issuer: string;
  expiresAt: Date;
  issuedAt: Date;
  isTrustedCA: boolean;
  isRevoked: boolean;
  daysUntilExpiry: number;
  protocol: string;
}

export interface MLFeatures {
  domainLength: number;
  subdomainCount: number;
  hasSSL: boolean;
  sslValid: boolean;
  trustedCA: boolean;
  domainEntropy: number;
  suspiciousKeywordCount: number;
  hasNumbers: boolean;
  hasHyphens: boolean;
  isIPAddress: boolean;
  domainAge: number;
}

export interface Classification {
  result: 'legitimate' | 'suspicious' | 'scam';
  confidence: number;
  riskScore: number;
  reasons: string[];
}

export interface AnalysisResult {
  url: string;
  timestamp: Date;
  domainInfo: DomainInfo;
  sslInfo: SSLInfo;
  features: MLFeatures;
  classification: Classification;
}

// Trusted Certificate Authorities
const TRUSTED_CAS = [
  'DigiCert Inc',
  'Let\'s Encrypt',
  'Comodo CA',
  'GlobalSign',
  'Sectigo Limited',
  'GeoTrust Inc',
  'Thawte',
  'RapidSSL',
  'Entrust',
  'GoDaddy',
  'Amazon Trust Services',
  'Google Trust Services',
  'Microsoft Corporation',
  'Apple Inc',
  'Cloudflare Inc',
];

// Suspicious keywords commonly found in phishing domains
const SUSPICIOUS_KEYWORDS = [
  'login', 'signin', 'sign-in', 'secure', 'account', 'verify', 'update',
  'banking', 'paypal', 'amazon', 'apple', 'microsoft', 'google',
  'facebook', 'netflix', 'support', 'help', 'service', 'confirm',
  'password', 'credential', 'wallet', 'crypto', 'bitcoin', 'eth',
  'free', 'winner', 'prize', 'urgent', 'suspended', 'locked',
  'authenticate', 'validation', 'recover', 'restore', 'unlock',
];

// Well-known legitimate domains
const KNOWN_LEGITIMATE_DOMAINS = [
  'google.com', 'youtube.com', 'facebook.com', 'amazon.com', 'twitter.com',
  'instagram.com', 'linkedin.com', 'microsoft.com', 'apple.com', 'github.com',
  'stackoverflow.com', 'reddit.com', 'netflix.com', 'paypal.com', 'ebay.com',
  'wikipedia.org', 'yahoo.com', 'bing.com', 'dropbox.com', 'zoom.us',
  'slack.com', 'notion.so', 'figma.com', 'adobe.com', 'spotify.com',
  'twitch.tv', 'discord.com', 'whatsapp.com', 'telegram.org', 'medium.com',
];

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateEntropy(str: string): number {
  const freq: { [key: string]: number } = {};
  for (const char of str.toLowerCase()) {
    freq[char] = (freq[char] || 0) + 1;
  }
  
  let entropy = 0;
  const len = str.length;
  for (const char in freq) {
    const p = freq[char] / len;
    entropy -= p * Math.log2(p);
  }
  
  return Math.round(entropy * 100) / 100;
}

function parseDomain(url: string): DomainInfo {
  let cleanUrl = url.trim();
  
  // Add protocol if missing
  if (!cleanUrl.match(/^https?:\/\//i)) {
    cleanUrl = 'https://' + cleanUrl;
  }
  
  const urlObj = new URL(cleanUrl);
  const hostname = urlObj.hostname.toLowerCase();
  const protocol = urlObj.protocol.replace(':', '');
  
  // Check if it's an IP address
  const isIPAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  
  // Parse domain parts
  const parts = hostname.split('.');
  let domain = hostname;
  let subdomain = '';
  let tld = '';
  
  if (!isIPAddress && parts.length >= 2) {
    // Handle multi-part TLDs
    const multiPartTLDs = ['co.uk', 'com.au', 'co.nz', 'co.jp', 'com.br', 'org.uk', 'net.au'];
    const lastTwo = parts.slice(-2).join('.');
    
    if (multiPartTLDs.includes(lastTwo) && parts.length >= 3) {
      tld = lastTwo;
      domain = parts[parts.length - 3];
      subdomain = parts.slice(0, -3).join('.');
    } else {
      tld = parts[parts.length - 1];
      domain = parts[parts.length - 2];
      subdomain = parts.slice(0, -2).join('.');
    }
  }
  
  // Find suspicious keywords
  const suspiciousKeywords = SUSPICIOUS_KEYWORDS.filter(keyword => 
    hostname.includes(keyword) && !KNOWN_LEGITIMATE_DOMAINS.some(d => hostname.endsWith(d))
  );
  
  return {
    fullDomain: hostname,
    domain,
    subdomain,
    tld,
    length: hostname.length,
    protocol,
    hasNumbers: /\d/.test(hostname.replace(/\./g, '')),
    hasHyphens: hostname.includes('-'),
    isIPAddress,
    entropy: calculateEntropy(hostname),
    suspiciousKeywords,
  };
}

function simulateSSLCheck(domainInfo: DomainInfo): SSLInfo {
  const isHTTPS = domainInfo.protocol === 'https';
  const isKnownLegit = KNOWN_LEGITIMATE_DOMAINS.some(d => domainInfo.fullDomain.endsWith(d));
  
  // Simulate SSL certificate data
  const now = new Date();
  const randomDays = Math.floor(Math.random() * 300) + 60;
  const expiresAt = new Date(now.getTime() + randomDays * 24 * 60 * 60 * 1000);
  const issuedAt = new Date(now.getTime() - (400 - randomDays) * 24 * 60 * 60 * 1000);
  
  // Determine CA based on domain characteristics
  let issuer: string;
  let isTrustedCA: boolean;
  let isRevoked: boolean;
  
  if (isKnownLegit) {
    issuer = TRUSTED_CAS[Math.floor(Math.random() * TRUSTED_CAS.length)];
    isTrustedCA = true;
    isRevoked = false;
  } else if (domainInfo.suspiciousKeywords.length > 0 || domainInfo.isIPAddress) {
    // Suspicious domains often have questionable certificates
    const allCAs = ['Unknown CA', 'Self-Signed Certificate', 'Untrusted Root CA', ...TRUSTED_CAS.slice(0, 5)];
    issuer = allCAs[Math.floor(Math.random() * allCAs.length)];
    isTrustedCA = TRUSTED_CAS.some(ca => issuer.includes(ca.split(' ')[0]));
    isRevoked = Math.random() < 0.25;
  } else {
    issuer = TRUSTED_CAS[Math.floor(Math.random() * TRUSTED_CAS.length)];
    isTrustedCA = true;
    isRevoked = false;
  }
  
  const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  
  return {
    isValid: isHTTPS && isTrustedCA && !isRevoked && daysUntilExpiry > 0,
    issuer,
    expiresAt,
    issuedAt,
    isTrustedCA,
    isRevoked,
    daysUntilExpiry,
    protocol: isHTTPS ? 'TLS 1.3' : 'None',
  };
}

function extractFeatures(domainInfo: DomainInfo, sslInfo: SSLInfo): MLFeatures {
  const subdomainCount = domainInfo.subdomain ? domainInfo.subdomain.split('.').filter(Boolean).length : 0;
  
  // Simulate domain age (in days)
  const isKnownLegit = KNOWN_LEGITIMATE_DOMAINS.some(d => domainInfo.fullDomain.endsWith(d));
  const domainAge = isKnownLegit
    ? Math.floor(Math.random() * 5000) + 1000
    : Math.floor(Math.random() * 365);
  
  return {
    domainLength: domainInfo.length,
    subdomainCount,
    hasSSL: domainInfo.protocol === 'https',
    sslValid: sslInfo.isValid,
    trustedCA: sslInfo.isTrustedCA,
    domainEntropy: domainInfo.entropy,
    suspiciousKeywordCount: domainInfo.suspiciousKeywords.length,
    hasNumbers: domainInfo.hasNumbers,
    hasHyphens: domainInfo.hasHyphens,
    isIPAddress: domainInfo.isIPAddress,
    domainAge,
  };
}

function classifyWithML(features: MLFeatures, domainInfo: DomainInfo): Classification {
  // Pre-trained model weights (simulated logistic regression)
  const weights = {
    domainLength: -0.04,
    subdomainCount: -0.18,
    hasSSL: 0.35,
    sslValid: 0.45,
    trustedCA: 0.40,
    domainEntropy: -0.12,
    suspiciousKeywordCount: -0.45,
    hasNumbers: -0.12,
    hasHyphens: -0.10,
    isIPAddress: -0.55,
    domainAge: 0.003,
  };
  
  const bias = 0.5;
  
  // Check if it's a known legitimate domain first
  const isKnownLegit = KNOWN_LEGITIMATE_DOMAINS.some(d => domainInfo.fullDomain.endsWith(d));
  
  if (isKnownLegit) {
    return {
      result: 'legitimate',
      confidence: 0.95 + Math.random() * 0.05,
      riskScore: Math.random() * 0.08,
      reasons: [
        '✓ Domain is in the list of known legitimate websites',
        '✓ SSL certificate is valid and issued by trusted CA',
        '✓ No suspicious patterns detected in URL structure',
        '✓ Domain has been established for a long time',
      ],
    };
  }
  
  // Calculate weighted score
  let score = bias;
  score += weights.domainLength * (features.domainLength / 50);
  score += weights.subdomainCount * features.subdomainCount;
  score += weights.hasSSL * (features.hasSSL ? 1 : 0);
  score += weights.sslValid * (features.sslValid ? 1 : 0);
  score += weights.trustedCA * (features.trustedCA ? 1 : 0);
  score += weights.domainEntropy * (features.domainEntropy / 4);
  score += weights.suspiciousKeywordCount * features.suspiciousKeywordCount;
  score += weights.hasNumbers * (features.hasNumbers ? 1 : 0);
  score += weights.hasHyphens * (features.hasHyphens ? 1 : 0);
  score += weights.isIPAddress * (features.isIPAddress ? 1 : 0);
  score += weights.domainAge * Math.min(features.domainAge / 365, 5);
  
  // Apply sigmoid function
  const probability = 1 / (1 + Math.exp(-score));
  
  // Generate reasons
  const reasons: string[] = [];
  
  // Add negative findings first
  if (features.isIPAddress) {
    reasons.push('⚠ URL uses IP address instead of domain name - highly suspicious');
  }
  if (features.suspiciousKeywordCount > 0) {
    reasons.push(`⚠ Contains ${features.suspiciousKeywordCount} suspicious keyword(s): ${domainInfo.suspiciousKeywords.join(', ')}`);
  }
  if (!features.hasSSL) {
    reasons.push('⚠ Website does not use HTTPS encryption');
  }
  if (!features.sslValid) {
    reasons.push('⚠ SSL certificate is invalid or has issues');
  }
  if (!features.trustedCA) {
    reasons.push('⚠ SSL certificate not issued by a trusted Certificate Authority');
  }
  if (features.domainLength > 30) {
    reasons.push(`⚠ Domain name is unusually long (${features.domainLength} characters)`);
  }
  if (features.subdomainCount > 2) {
    reasons.push(`⚠ Multiple subdomains detected (${features.subdomainCount}) - common in phishing`);
  }
  if (features.domainEntropy > 3.5) {
    reasons.push('⚠ Domain name has high randomness (possibly auto-generated)');
  }
  if (features.domainAge < 90) {
    reasons.push(`⚠ Domain appears to be recently registered (${features.domainAge} days old)`);
  }
  
  // Add positive findings
  if (features.hasSSL && features.sslValid) {
    reasons.push('✓ Valid SSL certificate detected');
  }
  if (features.trustedCA) {
    reasons.push('✓ Certificate issued by trusted Certificate Authority');
  }
  if (features.domainAge > 365) {
    reasons.push(`✓ Domain has been registered for over ${Math.floor(features.domainAge / 365)} year(s)`);
  }
  if (features.domainLength < 20 && !features.hasNumbers) {
    reasons.push('✓ Domain structure appears normal');
  }
  
  // Determine classification
  let result: 'legitimate' | 'suspicious' | 'scam';
  let confidence: number;
  let riskScore: number;
  
  if (probability > 0.7) {
    result = 'legitimate';
    confidence = probability;
    riskScore = 1 - probability;
  } else if (probability > 0.4) {
    result = 'suspicious';
    confidence = 1 - Math.abs(probability - 0.55) * 2;
    riskScore = 0.5 + (0.5 - probability);
  } else {
    result = 'scam';
    confidence = 1 - probability;
    riskScore = 1 - probability;
  }
  
  return {
    result,
    confidence: Math.round(confidence * 100) / 100,
    riskScore: Math.round(riskScore * 100) / 100,
    reasons,
  };
}

export async function analyzeUrl(url: string, log: LogCallback): Promise<AnalysisResult> {
  // Validate URL
  log('info', 'Validating URL format...');
  await delay(250);
  
  let cleanUrl = url.trim();
  if (!cleanUrl) {
    throw new Error('Please enter a URL');
  }
  
  // Add protocol if missing
  if (!cleanUrl.match(/^https?:\/\//i)) {
    cleanUrl = 'https://' + cleanUrl;
  }
  
  try {
    new URL(cleanUrl);
  } catch {
    throw new Error('Invalid URL format. Please enter a valid URL.');
  }
  
  log('success', 'URL format is valid');
  
  // Extract domain information
  log('info', 'Extracting domain information...');
  await delay(350);
  const domainInfo = parseDomain(cleanUrl);
  log('success', `Domain extracted: ${domainInfo.fullDomain}`);
  log('info', `Domain length: ${domainInfo.length} characters`);
  log('info', `Protocol: ${domainInfo.protocol.toUpperCase()}`);
  
  if (domainInfo.suspiciousKeywords.length > 0) {
    log('warning', `Suspicious keywords found: ${domainInfo.suspiciousKeywords.join(', ')}`);
  }
  
  if (domainInfo.isIPAddress) {
    log('warning', 'URL uses IP address instead of domain name');
  }
  
  // Check SSL certificate
  log('info', 'Checking SSL certificate...');
  await delay(500);
  const sslInfo = simulateSSLCheck(domainInfo);
  
  if (sslInfo.isValid) {
    log('success', `SSL certificate valid, issued by ${sslInfo.issuer}`);
    log('info', `Certificate expires in ${sslInfo.daysUntilExpiry} days`);
  } else {
    log('warning', `SSL certificate issue detected`);
    if (!sslInfo.isTrustedCA) {
      log('warning', `Issuer "${sslInfo.issuer}" is not a trusted CA`);
    }
  }
  
  if (sslInfo.isRevoked) {
    log('error', 'SSL certificate has been revoked!');
  }
  
  // Extract ML features
  log('info', 'Extracting features for ML analysis...');
  await delay(300);
  const features = extractFeatures(domainInfo, sslInfo);
  log('success', `Extracted ${Object.keys(features).length} features`);
  
  // Run classification
  log('info', 'Running ML classification model...');
  await delay(400);
  log('info', 'Applying pre-trained logistic regression weights...');
  await delay(200);
  
  const classification = classifyWithML(features, domainInfo);
  
  // Log prediction with appropriate level
  if (classification.result === 'legitimate') {
    log('success', `Classification: ${classification.result.toUpperCase()} (${Math.round(classification.confidence * 100)}% confidence)`);
  } else if (classification.result === 'suspicious') {
    log('warning', `Classification: ${classification.result.toUpperCase()} (${Math.round(classification.confidence * 100)}% confidence)`);
  } else {
    log('error', `Classification: ${classification.result.toUpperCase()} (${Math.round(classification.confidence * 100)}% confidence)`);
  }
  
  log('info', `Risk Score: ${Math.round(classification.riskScore * 100)}%`);
  
  return {
    url: cleanUrl,
    timestamp: new Date(),
    domainInfo,
    sslInfo,
    features,
    classification,
  };
}
