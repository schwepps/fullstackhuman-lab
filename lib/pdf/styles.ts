import { StyleSheet } from '@react-pdf/renderer'

/**
 * Shared PDF styles for report documents.
 * Uses Helvetica (built-in) to avoid font loading complexity.
 */
export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#374151', // gray-700
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 55,
  },
  // ─── Header / Footer ───
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  pageHeader: {
    position: 'absolute',
    top: 15,
    left: 55,
    right: 55,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageHeaderText: {
    fontSize: 8,
    color: '#9ca3af', // gray-400
    fontFamily: 'Helvetica',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  pageFooter: {
    position: 'absolute',
    bottom: 20,
    left: 55,
    right: 55,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageFooterText: {
    fontSize: 8,
    color: '#9ca3af',
  },
  // ─── Title area ───
  personaBadge: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#111827', // gray-900
    marginBottom: 6,
  },
  metadata: {
    fontSize: 9,
    color: '#6b7280', // gray-500
    marginBottom: 16,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  // ─── Section ───
  sectionHeading: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    marginTop: 20,
  },
  // ─── Markdown elements ───
  paragraph: {
    fontSize: 10.5,
    lineHeight: 1.6,
    marginBottom: 8,
    color: '#374151',
  },
  strong: {
    fontFamily: 'Helvetica-Bold',
  },
  italic: {
    fontStyle: 'italic',
    color: '#4b5563',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 12,
  },
  listBullet: {
    width: 12,
    fontSize: 10,
    color: '#9ca3af',
  },
  listContent: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 1.6,
    color: '#374151',
  },
  blockquote: {
    borderLeftWidth: 2,
    borderLeftColor: '#d1d5db',
    paddingLeft: 10,
    marginVertical: 8,
    color: '#4b5563',
    fontStyle: 'italic',
  },
  codeInline: {
    fontFamily: 'Courier',
    fontSize: 8.5,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  codeBlock: {
    fontFamily: 'Courier',
    fontSize: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 10,
    marginVertical: 8,
  },
  // ─── Table ───
  table: {
    marginVertical: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  tableCell: {
    flex: 1,
    padding: 5,
    fontSize: 9,
    color: '#374151',
  },
  tableHeaderCell: {
    flex: 1,
    padding: 5,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  // ─── Horizontal rule ───
  hr: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 14,
  },
  // ─── Link ───
  link: {
    textDecoration: 'underline',
  },
  // ─── Visual container ───
  visualContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  // ─── Signature treatment ───
  signatureCallout: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingVertical: 6,
    marginVertical: 8,
  },
  signatureTable: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginVertical: 8,
  },
  signatureStatement: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 8,
    marginVertical: 8,
  },
  // ─── Branding ───
  branding: {
    fontSize: 7,
    color: '#d1d5db',
    textAlign: 'center',
    marginTop: 16,
  },
})
