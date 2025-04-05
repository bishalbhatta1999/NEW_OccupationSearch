import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

// Initialize pdfmake with fonts
pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;

/**
 * Links to each social media icon (remote PNG).
 */
const iconLinks: Record<string, string> = {
  facebook:
    'https://storage.googleapis.com/msgsndr/TXMfB5A5X6UeyzYz0NBz/media/67d2a8a1794ed97fd89957d7.png',
  instagram:
    'https://storage.googleapis.com/msgsndr/TXMfB5A5X6UeyzYz0NBz/media/67d2a8a1acfadb03cb00f16e.png',
  linkedin:
    'https://storage.googleapis.com/msgsndr/TXMfB5A5X6UeyzYz0NBz/media/67d2a8a1acfadb1fc500f16f.png',
  tiktok:
    'https://storage.googleapis.com/msgsndr/TXMfB5A5X6UeyzYz0NBz/media/67d2a8a8794ed93f729957da.png',
  whatsapp:
    'https://storage.googleapis.com/msgsndr/TXMfB5A5X6UeyzYz0NBz/media/67d2a8a2794ed90ac99957d8.png',
  youtube:
    'https://storage.googleapis.com/msgsndr/TXMfB5A5X6UeyzYz0NBz/media/67d2a8a1acfadb0cde00f16d.png',
};

interface PDFOptions {
  coverTitle?: string;
  coverSubtitle?: string;
  filename?: string;
  includeTimestamp?: boolean;
  includePageNumbers?: boolean;
}

interface SocialMediaLink {
  type: string;
  url: string;
}

interface CompanyAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface CompanyDetails {
  name: string;
  domain: string;
  phone: string;
  email: string;
  logo?: string;
  socialMedia?: SocialMediaLink[];
  address?: CompanyAddress;
}

export default class PDFGenerator {
  private docDefinition: any;
  private options: PDFOptions;

  private readonly COLORS = {
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#3b82f6',
    text: {
      dark: '#1f2937',
      medium: '#4b5563',
      light: '#9ca3af'
    },
    background: {
      light: '#f8fafc',
      medium: '#f1f5f9'
    }
  };

  private companyDetails: CompanyDetails | null = null;
  private logoBase64: string | null = null;
  private providedUrlBase64: string | null = null;
  private socialIconsBase64: Record<string, string | null> = {};

  constructor(options: PDFOptions = {}) {
    this.options = {
      filename: 'document.pdf',
      includeTimestamp: true,
      includePageNumbers: true,
      ...options,
    };

    this.docDefinition = {
      pageSize: 'A4',
      pageMargins: [50, 70, 50, 70],
      fonts: {
        Roboto: {
          normal: 'Roboto-Regular.ttf',
          bold: 'Roboto-Medium.ttf',
          italics: 'Roboto-Italic.ttf',
          bolditalics: 'Roboto-MediumItalic.ttf'
        }
      },
      content: [],
      defaultStyle: {
        font: 'Roboto',
        fontSize: 11,
        color: this.COLORS.text.dark,
        lineHeight: 1.4,
      },
      styles: {
        header: {
          fontSize: 24,
          bold: true,
          color: this.COLORS.primary,
          font: 'Roboto',
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 14,
          color: this.COLORS.secondary,
          font: 'Roboto',
          margin: [0, 0, 0, 20],
        },
        sectionTitle: {
          fontSize: 18,
          bold: true,
          color: this.COLORS.primary,
          font: 'Roboto',
          margin: [0, 20, 0, 15],
        },
        tableHeader: {
          fontSize: 13,
          bold: true,
          color: '#ffffff',
          fillColor: this.COLORS.primary,
          font: 'Roboto',
          margin: [5, 5, 5, 5],
        },
        tableCell: {
          fontSize: 12,
          font: 'Roboto',
          margin: [5, 5, 5, 5],
        },
        footer: {
          fontSize: 9,
          color: this.COLORS.secondary,
          font: 'Roboto',
          alignment: 'center',
        },
        note: {
          fontSize: 11,
          color: this.COLORS.text.medium,
          font: 'Roboto',
          italics: true,
          margin: [0, 5, 0, 5],
        },
        emphasis: {
          bold: true,
          color: this.COLORS.accent,
          font: 'Roboto',
        }
      },
    };
  }

  /**
   * Reads Firestore for the current user, logs the data, and loads:
   *  - Company details + address
   *  - Company logo
   *  - Provided URL example image
   *  - Social media icons
   */
  async init() {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.warn('[PDFGenerator] No user logged in – using fallback details');
      this.companyDetails = this.getFallbackDetails();
    } else {
      try {
        const companyRef = doc(db, 'companies', userId);
        const docSnap = await getDoc(companyRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          console.log('[PDFGenerator] Firestore data:', data); // <-- LOG FULL DATA

          this.companyDetails = {
            name: data.name || 'Global Select Education',
            domain: data.domain || 'www.globalselect.com.au',
            phone: data.phone || '+61 08 7081 5229',
            email: data.emailPreferences?.[0]?.address || 'info@occupationsearch.com.au',
            logo: data.logo || '',
            socialMedia: data.socialMedia || [],
            address: data.address || {},
          };

          if (this.companyDetails.logo) {
            try {
              this.logoBase64 = await this.fetchImageAsBase64(this.companyDetails.logo);
            } catch (fetchErr) {
              console.error('[PDFGenerator] Error converting logo to base64:', fetchErr);
              this.logoBase64 = null;
            }
          }
        } else {
          console.warn('[PDFGenerator] Firestore doc not found – fallback details');
          this.companyDetails = this.getFallbackDetails();
        }
      } catch (err) {
        console.error('[PDFGenerator] Error reading Firestore:', err);
        this.companyDetails = this.getFallbackDetails();
      }
    }

    // Example "provided" URL (you can remove if not needed).
    const providedUrl = 'https://images.unsplash.com/photo-1554224155-6726b3ff858f';
    try {
      this.providedUrlBase64 = await this.fetchImageAsBase64(providedUrl);
    } catch (e) {
      console.warn('[PDFGenerator] Failed to fetch provided image:', e);
      this.providedUrlBase64 = null;
    }

    // Social Icons
    if (this.companyDetails && this.companyDetails.socialMedia?.length) {
      for (const link of this.companyDetails.socialMedia) {
        const platform = link.type.toLowerCase();
        const iconUrl = iconLinks[platform];

        if (iconUrl && !this.socialIconsBase64[platform]) {
          try {
            this.socialIconsBase64[platform] = await this.fetchImageAsBase64(iconUrl);
            console.log(`[PDFGenerator] Fetched icon for ${platform}`);
          } catch (err) {
            console.error(`[PDFGenerator] Error fetching icon for ${platform}`, err);
            this.socialIconsBase64[platform] = null;
          }
        }
      }
    }
  }

  private async fetchImageAsBase64(url: string): Promise<string | null> {
    if (!url) {
      console.warn('[PDFGenerator] No URL provided for image conversion');
      return null;
    }

    try {
      new URL(url);
    } catch {
      console.warn('[PDFGenerator] Invalid URL format:', url);
      return null;
    }

    try {
      console.log('[PDFGenerator] Fetching image from:', url);
      const response = await fetch(url, {
        mode: 'cors',
        credentials: 'omit',
        headers: {
          Accept: 'image/*',
        },
      });

      if (!response.ok) {
        console.error(`[PDFGenerator] Failed to fetch image. Status: ${response.status}`);
        return null;
      }

      const blob = await response.blob();
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validImageTypes.includes(blob.type)) {
        console.error('[PDFGenerator] Invalid image type:', blob.type);
        return null;
      }

      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('FileReader result was not a string'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error('[PDFGenerator] Failed to process image:', e);
      return null;
    }
  }

  private getFallbackDetails(): CompanyDetails {
    return {
      name: 'Global Select Education',
      domain: 'www.globalselect.com.au',
      phone: '+61 08 7081 5229',
      email: 'info@occupationsearch.com.au',
      socialMedia: [],
      address: {
        country: 'Australia',
      },
    };
  }

  /**
   * Creates a cover page that displays:
   *  - Logo or Company Name
   *  - Timestamp (if enabled)
   *  - Title / Subtitle
   *  - Decorative line
   *  - Provided image
   *  - Company details (phone, email, address lines)
   */
  addCoverLetter() {
    const { coverTitle, coverSubtitle, includeTimestamp } = this.options;
    const content: any[] = [];

    // Header with gradient background
    content.push({
      canvas: [{
        type: 'rect',
        x: 0,
        y: 0,
        w: 595.28,  // A4 width
        h: 150,
        color: this.COLORS.primary,
        opacity: 0.1
      }]
    });

    // Logo + Company Name
    const headerStack: any[] = [];

    if (this.logoBase64) {
      headerStack.push({
        image: this.logoBase64,
        width: 150,
        alignment: 'left',
        margin: [0, 20, 0, 15],
      });
    } else {
      headerStack.push({
        text: this.companyDetails?.name || 'Global Select Education',
        fontSize: 24,
        bold: true,
        color: this.COLORS.primary,
        alignment: 'left',
        margin: [0, 20, 0, 15],
      });
    }

    if (includeTimestamp) {
      headerStack.push({
        text: new Date().toLocaleString('en-AU', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        }),
        alignment: 'right',
        color: this.COLORS.text.light,
        fontSize: 11,
        margin: [0, 5, 0, 15],
      });
    }

    content.push({ stack: headerStack, margin: [0, 0, 0, 30] });

    // TITLE / SUBTITLE
    if (coverTitle) {
      content.push({
        text: coverTitle,
        style: 'header',
        alignment: 'center',
        margin: [0, 0, 0, 25],
      });
    }

    if (coverSubtitle) {
      content.push({
        text: coverSubtitle,
        style: 'subheader',
        alignment: 'center',
        margin: [0, 0, 0, 35],
      });
    }

    // Decorative Line with gradient
    content.push({
      canvas: [
        {
          type: 'line',
          x1: 40,
          y1: 0,
          x2: 520,
          y2: 0,
          lineWidth: 2,
          lineColor: this.COLORS.primary,
          opacity: 0.6
        },
      ],
      margin: [0, 15, 0, 25],
    });

    // PROVIDED IMAGE
    if (this.providedUrlBase64) {
      content.push({
        image: this.providedUrlBase64,
        width: 300,
        alignment: 'center',
        margin: [0, 20, 0, 20],
      });
    } else {
      content.push({
        text: '(No provided image found.)',
        alignment: 'center',
        color: 'gray',
        margin: [0, 20, 0, 20],
      });
    }

    // COMPANY DETAILS
    if (this.companyDetails) {
      const { name, domain, phone, email, address } = this.companyDetails;

      // Here is where we show phone, email, and address lines
      const lines: any[] = [
        {
          text: name,
          fontSize: 14,
          bold: true,
          color: '#2563eb',
          alignment: 'center',
        },
        {
          text: domain,
          alignment: 'center',
          margin: [0, 5, 0, 0],
        },
        {
          text: `${phone} | ${email}`,
          alignment: 'center',
          margin: [0, 5, 0, 0],
        },
      ];

      // If address data is present, show each field on its own line
      if (address) {
        if (address.street) {
          lines.push({
            text: address.street,
            alignment: 'center',
            margin: [0, 5, 0, 0],
          });
        }
        if (address.city) {
          lines.push({
            text: address.city,
            alignment: 'center',
            margin: [0, 2, 0, 0],
          });
        }
        if (address.state) {
          lines.push({
            text: address.state,
            alignment: 'center',
            margin: [0, 2, 0, 0],
          });
        }
        if (address.country) {
          lines.push({
            text: address.country,
            alignment: 'center',
            margin: [0, 2, 0, 0],
          });
        }
      }

      content.push({
        stack: lines,
        margin: [0, 40, 0, 0],
      });
    }

    // PAGE BREAK
    content.push({ text: '', pageBreak: 'after' });

    this.docDefinition.content.push(...content);
  }

  /**
   * Adds a section title (styled).
   */
  addSectionTitle(title: string) {
    this.docDefinition.content.push({
      text: title,
      style: 'sectionTitle',
      margin: [0, 20, 0, 10],
    });
  }

  /**
   * Adds a data table.
   */
  addTable(columns: { header: string; dataKey: string }[], data: any[]) {
    const headerRow = columns.map((col) => ({
      text: col.header,
      style: 'tableHeader',
      alignment: 'left',
    }));

    const bodyRows = data.map((row) =>
      columns.map((col) => ({
        text: row[col.dataKey]?.toString() || '',
        style: 'tableCell',
        alignment: col.dataKey === 'details' ? 'left' : 'left',
      }))
    );

    this.docDefinition.content.push({
      table: {
        headerRows: 1,
        widths: columns.map(() => '*'),
        body: [headerRow, ...bodyRows],
      },
      layout: {
        fillColor: (rowIndex: number) => {
          if (rowIndex === 0) return this.COLORS.primary;
          return rowIndex % 2 ? this.COLORS.background.light : null;
        },
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => this.COLORS.background.medium,
        vLineColor: () => this.COLORS.background.medium,
        paddingLeft: () => 10,
        paddingRight: () => 10,
        paddingTop: () => 10,
        paddingBottom: () => 10,
      },
      margin: [0, 0, 0, 25],
    });
  }

  /**
   * Adds a block with a title and paragraph of text.
   */
  addTextBlock(title: string, content: string) {
    this.docDefinition.content.push({
      stack: [
        {
          text: title,
          style: 'sectionTitle',
          margin: [0, 0, 0, 10]
        },
        {
          text: content,
          margin: [0, 0, 0, 25],
          lineHeight: 1.5,
          color: this.COLORS.text.medium
        },
      ],
    });
  }

  /**
   * Generates and downloads the PDF.
   * Includes a footer with page #, social icons, etc. if enabled.
   */
  save() {
    if (this.options.includePageNumbers) {
      this.docDefinition.footer = (currentPage: number, pageCount: number) => {
        // Table with 3 columns:
        // (1) Company name + domain
        // (2) Social media icons
        // (3) Page numbering
        const leftColumn = [
          {
            text: this.companyDetails?.name || '',
            style: 'footer',
            alignment: 'left',
            bold: true,
          },
          {
            text: this.companyDetails?.domain || '',
            style: 'footer',
            alignment: 'left',
          },
        ];

        let socialIcons: any[] = [];
        if (this.companyDetails?.socialMedia?.length) {
          socialIcons = this.companyDetails.socialMedia.map((link) => {
            const platform = link.type.toLowerCase();
            const base64Icon = this.socialIconsBase64[platform];
            if (!base64Icon) {
              return { text: '' };
            }
            return {
              columns: [
                {
                  image: base64Icon,
                  width: 10,
                  margin: [0, 0, 3, 0],
                },
                {
                  text: link.type,
                  link: link.url,
                  color: '#2563eb',
                  fontSize: 9,
                  margin: [0, 1, 0, 0],
                },
              ],
              columnGap: 2,
              margin: [0, 0, 8, 0],
            };
          });
        }

        const rightColumn = [
          {
            text: `Page ${currentPage} of ${pageCount}`,
            style: 'footer',
            alignment: 'right',
          },
        ];

        return {
          margin: [40, 0, 40, 0],
          stack: [
            {
              canvas: [
                {
                  type: 'line',
                  x1: 0,
                  y1: 0,
                  x2: 515,
                  y2: 0,
                  lineWidth: 0.5,
                  lineColor: '#e2e8f0',
                },
              ],
              margin: [0, 5, 0, 5],
            },
            {
              table: {
                widths: ['*', 'auto', 'auto'],
                body: [
                  [
                    { stack: leftColumn, border: [false, false, false, false] },
                    {
                      stack: socialIcons,
                      border: [false, false, false, false],
                      alignment: 'center',
                    },
                    { stack: rightColumn, border: [false, false, false, false] },
                  ],
                ],
              },
              layout: 'noBorders',
            },
          ],
        };
      };
    }

    const filename = this.options.filename || 'document.pdf';
    pdfMake.createPdf(this.docDefinition).download(filename);
  }
}