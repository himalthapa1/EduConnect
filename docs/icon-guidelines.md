# 🎨 EduConnect Icon System

## Overview

EduConnect uses **Lucide icons** via `react-icons/lu` for a consistent, professional appearance. All icons are centralized in `src/ui/icons.js` to ensure maintainability and prevent import errors.

## 🏗️ Architecture

### Central Icon Management
- **Single source of truth**: `src/ui/icons.js`
- **Namespace imports**: Uses `import * as Lu from "react-icons/lu"` for safety
- **Semantic naming**: Icons are mapped to logical names (e.g., `chat` → `LuMessageCircle`)

### Import Pattern
```js
// CORRECT - Use central icon system
import { Icons } from '../ui/icons';
<Icons.chat size={16} />

//  AVOID - Direct imports can cause errors
import { LuMessageCircle } from 'react-icons/lu';
```

## 📋 Available Icons

### Core UI Icons
| Name | Icon | Usage |
|------|------|-------|
| `home` | 🏠 | Home/Dashboard navigation |
| `calendar` | 📅 | Dates, schedules, events |
| `clock` | 🕐 | Time, duration |
| `users` | 👥 | People, members, groups |
| `book` | 📚 | Study materials, courses |
| `add` | ➕ | Add/create actions |
| `delete` | 🗑️ | Remove/delete actions |
| `check` | ✅ | Success, confirmation |
| `close` | ❌ | Close, cancel |
| `eye` | 👁️ | Show/hide password |
| `eyeOff` | 👁️‍🗨️ | Hide password |
| `upload` | ⬆️ | File uploads |
| `logout` | 🚪 | Sign out |
| `login` | 🔑 | Sign in |
| `settings` | ⚙️ | Preferences, configuration |
| `user` | 👤 | Profile, account |
| `video` | 🎥 | Video calls, meetings |
| `chat` | 💬 | Messages, chat |
| `checkCircle` | 🎯 | Recommendations, targets |
| `file` | 📁 | Documents, resources |
| `share` | 🔗 | Share actions |

### Study Features
| Name | Icon | Usage |
|------|------|-------|
| `timer` | ⏱️ | Study timers, duration |
| `play` | ▶️ | Start actions |
| `pause` | ⏸️ | Pause actions |
| `coffee` | ☕ | Breaks, rest periods |

### Navigation
| Name | Icon | Usage |
|------|------|-------|
| `edit` | ✏️ | Edit actions |
| `search` | 🔍 | Search functionality |
| `filter` | 🔧 | Filter options |
| `chevronDown` | ▼ | Dropdown arrows |
| `chevronRight` | ▶️ | Expand/collapse |
| `more` | ⋯ | More options menu |
| `trendingUp` | 📈 | Progress, growth |

## 🎯 Usage Guidelines

### Sizing
- **Small icons** (14-16px): Secondary actions, inline text
- **Medium icons** (18-20px): Primary actions, headers
- **Large icons** (24px+): Hero elements, modals

### Accessibility
- Always include `aria-label` for icon-only buttons
- Use semantic color combinations
- Ensure sufficient contrast

### Examples
```jsx
// ✅ Good - With accessibility
<button aria-label="Group Chat">
  <Icons.chat size={16} />
</button>

// ✅ Good - Semantic sizing
<Icons.checkCircle size={20} /> Recommended for You

// ✅ Good - Consistent theming
<Icons.users size={14} /> {count} members
```

## 🔧 Adding New Icons

### Step 1: Verify Icon Exists
1. Go to [lucide.dev/icons](https://lucide.dev/icons)
2. Search for your icon visually
3. Note the exact export name (e.g., `LuStar` for ⭐)

### Step 2: Add to Icons Map
```js
// In src/ui/icons.js
export const Icons = {
  // ... existing icons
  star: Lu.LuStar,  // Add new icon
};
```

### Step 3: Use in Components
```jsx
import { Icons } from '../ui/icons';
<Icons.star size={16} />
```

## 🚨 Common Mistakes to Avoid

### ❌ Wrong Icon Names
```js
// These DON'T exist in Lucide:
LuEdit      // Use LuPencil
LuHome      // Use LuHouse
LuLogout    // Use LuLogOut
LuChat      // Use LuMessageCircle
```

### ❌ Direct Imports
```js
// ❌ AVOID - Can cause import errors
import { LuPencil } from 'react-icons/lu';

// ✅ PREFERRED - Uses central system
import { Icons } from '../ui/icons';
<Icons.edit />
```

### ❌ Inconsistent Sizing
```js
// ❌ AVOID - Inconsistent
<Icons.chat size={12} />
<Icons.chat size={24} />

// ✅ PREFERRED - Consistent within context
<Icons.chat size={16} />  // Standard size
```

## 🔍 Troubleshooting

### "X is not exported from react-icons/lu"
1. Check [lucide.dev/icons](https://lucide.dev/icons) for correct name
2. Update `src/ui/icons.js` with correct Lucide name
3. Restart dev server if needed

### Icons not showing
1. Verify import: `import { Icons } from '../ui/icons'`
2. Check component is using `<Icons.name />` syntax
3. Ensure size prop is provided

### VS Code autocomplete not working
1. Make sure you're typing `Lu.` in the icons.js file
2. Only valid Lucide icons will appear
3. If icon doesn't appear, it doesn't exist in Lucide

## 📚 Resources

- [Lucide Icon Library](https://lucide.dev/icons) - Official icon reference
- [React Icons Documentation](https://react-icons.github.io/react-icons/) - Usage guide
- [EduConnect Icon System](./icon-guidelines.md) - This guide

## 🎨 Design Principles

1. **Consistency**: Use the same icon for the same action everywhere
2. **Clarity**: Choose icons that clearly represent their function
3. **Accessibility**: Ensure icons work with screen readers
4. **Maintainability**: Central system prevents icon drift
5. **Future-proofing**: Easy to replace icons globally
