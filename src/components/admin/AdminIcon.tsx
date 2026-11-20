import {
  ArrowLeft, ArrowRight, BadgePercent, Download, BarChart3, Bell, Boxes, Building2, CalendarDays, Check, ChevronDown, ChevronRight,
  CircleAlert, Copy, CreditCard, Droplet, ExternalLink, Eye, FileSpreadsheet, FileText, Link2, Unlink, GripVertical, Handshake, History, Home, Image, Inbox,
  Info, LayoutDashboard, LayoutTemplate, LifeBuoy, LogOut, Mail, MapPin, Menu, MessageCircle, MessagesSquare, Minus, Monitor,
  Package, PanelTop, Phone, Play, Plus, Printer, RefreshCw, Search, Send, Settings, ShieldCheck, ShoppingBag, ShoppingCart,
  Smartphone, Sparkles, Star, Tag, Ticket, Trash2, Truck, Upload, User, Users, Video, Wrench, X, type LucideIcon,
} from 'lucide-react';

/**
 * Admin icons: one consistent line set (Lucide) at one stroke weight. Same `name` API as the storefront's
 * <Icon>, so the admin can swap imports without touching call sites.
 */
const icons: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard, box: Package, card: CreditCard, tag: Tag, inbox: Boxes, users: Users, user: User,
  chat: MessageCircle, responses: MessagesSquare, drop: Droplet, wrench: Wrench, star: Star, sparkle: Sparkles, layout: LayoutTemplate,
  ribbon: PanelTop, doc: FileText, gift: BadgePercent, coupon: BadgePercent, chart: BarChart3, send: Send, history: History,
  settings: Settings, bell: Bell, logout: LogOut, external: ExternalLink, menu: Menu, close: X, arrow: ArrowRight,
  arrowLeft: ArrowLeft, chevron: ChevronRight, down: ChevronDown, plus: Plus, minus: Minus, check: Check, trash: Trash2,
  copy: Copy, image: Image, video: Video, upload: Upload, grip: GripVertical, eye: Eye, play: Play, refresh: RefreshCw,
  alert: CircleAlert, info: Info, download: Download, calendar: CalendarDays, desktop: Monitor, mobile: Smartphone, search: Search,
  print: Printer, ticket: Ticket, truck: Truck, phone: Phone, mail: Mail, pin: MapPin, home: Home, bag: ShoppingBag,
  cart: ShoppingCart, sheet: FileSpreadsheet, link: Link2, unlink: Unlink, building: Building2, partner: Handshake, support: LifeBuoy, shield: ShieldCheck, inboxTray: Inbox,
};

export function Icon({ name, className = 'size-5', strokeWidth = 1.75 }: { name: string; className?: string; strokeWidth?: number }) {
  const C = icons[name] ?? Info;
  return <C className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}
