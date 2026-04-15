# Stories of Change — Deployment Log

**Deployed to:** https://stg.lichfl.mgrant.in/  
**Date:** 16 April 2026  
**Deployed by:** API (sunandan@dhwaniris.com)

## What was deployed

### 1. DocTypes Created (Custom)
- **Story of Change** — Main DocType (39 fields, autoname: SOC-.YYYY.-.####)
- **Story of Change Media** — Child table (4 fields: media_type, file, video_url, caption)

### 2. Role Created
- **Comms User** — New role for communications team (desk_access=1)
- ⚠️ **Note:** Comms User permission on Story of Change DocType needs to be added manually by Administrator (Frappe restricts non-admin from assigning new roles to custom DocTypes)

### 3. Permission Matrix (Story of Change)
| Role | Level | Read | Write | Create | Delete | If Owner |
|------|-------|------|-------|--------|--------|----------|
| System Manager | 0 | ✓ | ✓ | ✓ | ✓ | - |
| System Manager | 1 | ✓ | ✓ | - | - | - |
| Partner NGO | 0 | ✓ | ✓ | ✓ | ✓ | ✓ |
| NGO Admin | 0 | ✓ | ✓ | ✓ | ✓ | ✓ |
| PM | 0 | ✓ | ✓ | ✓ | - | - |
| SPM | 0 | ✓ | ✓ | ✓ | - | - |
| CSR & ESG JGM | 0 | ✓ | ✓ | ✓ | - | - |
| CSR & ESG JGM | 1 | ✓ | ✓ | - | - | - |
| Donor Admin | 0 | ✓ | - | - | - | - |
| Donor Observer | 0 | ✓ | - | - | - | - |

### 4. Custom Fields on Grant Form
- **stories_of_change_tab** — Tab Break (inserted after Approvals tab)
- **stories_of_change_html** — HTML field (rendered by client script)

### 5. Client Scripts
- **Grant-Stories of Change Tab** — Renders stories list, "+ Add Story" button, and "View All" link on Grant form
- **Field Visit Report-Create Story Bridge** — Adds "Create Story of Change" button under Actions on Field Visit Report

### 6. Workspace
- **Stories of Change** — Workspace under Grant Management, with shortcut to Story of Change list

## Manual Steps Required
1. **Add Comms User permissions** — Log in as Administrator → Story of Change DocType → Permissions:
   - Level 0: Read only
   - Level 1: Read + Write
2. **Cross-NGO visibility** — Add Server Script for `permission_query_conditions`:
   ```python
   # For Story of Change
   if frappe.session.user != 'Administrator':
       user_roles = frappe.get_roles()
       if 'Partner NGO' in user_roles or 'NGO Admin' in user_roles:
           return "(owner = '{user}' OR status IN ('Submitted', 'Featured'))".format(user=frappe.session.user)
   ```
3. **Gallery cleanup** — The old Gallery DocType (0 records) can be deleted or hidden from workspace
