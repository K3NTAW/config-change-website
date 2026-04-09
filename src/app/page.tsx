import { Layout } from '@/components/layout/layout'
import {
  ArrowRight,
  CheckCircle2,
  FileDown,
  FileText,
  GitFork,
  GitBranch,
  Rocket,
  Server,
  Upload
} from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <Layout>
      <div className="bg-[#F8F9FA] text-slate-800">
        {/* Hero Section */}
        <section className="container relative overflow-hidden px-4 py-24 md:px-8 md:py-32">
          <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#0055FF]/5 blur-3xl" />
          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <h1 className="text-5xl font-semibold tracking-tight text-[#001D70] sm:text-6xl">
              NRT Rules Automation
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
              Upload Excel files to generate NRT Ruleset XML and automatically push to GIT.
              Streamline your CRM operations with automated processing.
            </p>
            <div className="mt-10 flex items-center justify-center">
              <Link
                href="/nrt-ruleset"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#0055FF] px-8 text-base font-medium text-white shadow-md shadow-[#0055FF]/20 transition-colors hover:bg-[#0044CC]"
              >
                Process NRT Ruleset
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container rounded-t-[3rem] bg-white px-4 py-24 shadow-[0_-10px_40px_rgba(0,0,0,0.02)] md:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-[#001D70] sm:text-4xl">
              Simple & Powerful
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Everything you need to process NRT Rulesets from Excel to GIT
            </p>
          </div>

          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="group flex flex-col gap-4 rounded-2xl border border-transparent bg-[#F8F9FA] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-slate-100 hover:shadow-lg">
                <div className="mb-2 flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm transition-colors group-hover:bg-[#0055FF]">
                    <Upload className="h-6 w-6 text-[#0055FF] transition-colors group-hover:text-white" />
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight text-[#001D70]">1. Upload Excel</h3>
                </div>
                <p className="mb-4 text-sm text-slate-600">Upload your Excel file containing NRT Ruleset data.</p>
                <ul className="mt-auto space-y-3 text-sm text-slate-500">
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#0055FF]" /> Supports .xlsx files</li>
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#0055FF]" /> File validation</li>
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#0055FF]" /> Secure upload</li>
                </ul>
              </div>

              <div className="group flex flex-col gap-4 rounded-2xl border border-transparent bg-[#F8F9FA] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-slate-100 hover:shadow-lg">
                <div className="mb-2 flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm transition-colors group-hover:bg-[#0055FF]">
                    <FileText className="h-6 w-6 text-[#0055FF] transition-colors group-hover:text-white" />
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight text-[#001D70]">2. Generate XML</h3>
                </div>
                <p className="mb-4 text-sm text-slate-600">Automatically generate XML from your Excel data.</p>
                <ul className="mt-auto space-y-3 text-sm text-slate-500">
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#0055FF]" /> Release & env selection</li>
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#0055FF]" /> Auto XML generation</li>
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#0055FF]" /> Naming conventions</li>
                </ul>
              </div>

              <div className="group flex flex-col gap-4 rounded-2xl border border-transparent bg-[#F8F9FA] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-slate-100 hover:shadow-lg">
                <div className="mb-2 flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm transition-colors group-hover:bg-[#0055FF]">
                    <GitBranch className="h-6 w-6 text-[#0055FF] transition-colors group-hover:text-white" />
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight text-[#001D70]">3. Push to GIT</h3>
                </div>
                <p className="mb-4 text-sm text-slate-600">Automatically commit and push to your GIT repository.</p>
                <ul className="mt-auto space-y-3 text-sm text-slate-500">
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#0055FF]" /> Automatic GIT commit</li>
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#0055FF]" /> Story number tracking</li>
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#0055FF]" /> Git diff preview</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section className="container px-4 py-24 md:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="relative overflow-hidden rounded-3xl bg-[#001D70] p-8 sm:p-12">
              <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/3 translate-x-1/3 rounded-full bg-white/5 blur-2xl" />

              <div className="relative z-10 flex flex-col items-center gap-12 md:flex-row">
                <div className="flex-1 space-y-6 text-white">
                  <div className="flex w-fit items-center space-x-3 rounded-full bg-white/10 px-4 py-2 text-[#0055FF] backdrop-blur-sm">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-medium text-white">NRT Ruleset Processing</span>
                  </div>
                  <h3 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    Complete workflow from Excel to GIT in one process
                  </h3>

                  <div className="grid grid-cols-1 gap-8 pt-4 sm:grid-cols-2">
                    <div>
                      <h4 className="mb-4 text-lg font-medium tracking-tight text-white/90">What it does:</h4>
                      <ul className="space-y-2 text-sm text-white/70">
                        <li className="flex items-start gap-2"><ArrowRight className="mt-0.5 h-4 w-4 shrink-0" /> Uploads & validates Excel</li>
                        <li className="flex items-start gap-2"><ArrowRight className="mt-0.5 h-4 w-4 shrink-0" /> Generates XML</li>
                        <li className="flex items-start gap-2"><ArrowRight className="mt-0.5 h-4 w-4 shrink-0" /> Commits to GIT with tracking</li>
                        <li className="flex items-start gap-2"><ArrowRight className="mt-0.5 h-4 w-4 shrink-0" /> Shows diffs before push</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="mb-4 text-lg font-medium tracking-tight text-white/90">Configuration:</h4>
                      <ul className="space-y-2 text-sm text-white/70">
                        <li className="flex items-start gap-2"><ArrowRight className="mt-0.5 h-4 w-4 shrink-0" /> Select release (R1.0, etc.)</li>
                        <li className="flex items-start gap-2"><ArrowRight className="mt-0.5 h-4 w-4 shrink-0" /> Choose environment</li>
                        <li className="flex items-start gap-2"><ArrowRight className="mt-0.5 h-4 w-4 shrink-0" /> Optional story number</li>
                        <li className="flex items-start gap-2"><ArrowRight className="mt-0.5 h-4 w-4 shrink-0" /> Automatic timestamping</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mx-auto flex w-full max-w-sm shrink-0 flex-col justify-center rounded-2xl bg-white p-6 text-center shadow-xl md:w-auto">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F0F4FF]">
                    <Rocket className="h-8 w-8 text-[#0055FF]" />
                  </div>
                  <h4 className="mb-2 text-xl font-semibold tracking-tight text-[#001D70]">Ready to automate?</h4>
                  <p className="mb-6 text-sm text-slate-500">Skip the manual work and process your rulesets instantly.</p>
                  <Link
                    href="/nrt-ruleset"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0055FF] px-6 text-sm font-medium text-white transition-colors hover:bg-[#0044CC]"
                  >
                    Start Processing
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Status Section */}
        <section className="container mb-24 px-4 py-12 md:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-[0_2px_20px_rgba(0,0,0,0.03)] sm:p-10">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-8 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight text-[#001D70]">System Status</h3>
                  <p className="mt-1 text-sm text-slate-500">Real-time status of processing modules</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#E8F8F2] px-4 py-1.5 text-xs font-semibold text-[#008A52]">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#008A52]" />
                  System Online
                </span>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-6 divide-slate-100 sm:grid-cols-3 sm:divide-x">
                <div className="flex flex-col items-center justify-center pt-6 text-center sm:pt-0">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F8F2] text-[#008A52]">
                    <Server className="h-6 w-6" />
                  </div>
                  <div className="text-lg font-semibold text-slate-800">Ready</div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-widest text-slate-500">Core System</div>
                </div>
                <div className="flex flex-col items-center justify-center pt-6 text-center sm:pt-0">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F4FF] text-[#0055FF]">
                    <FileDown className="h-6 w-6" />
                  </div>
                  <div className="text-lg font-semibold text-slate-800">Processing</div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-widest text-slate-500">Excel to XML</div>
                </div>
                <div className="flex flex-col items-center justify-center pt-6 text-center sm:pt-0">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F0FF] text-[#7B1FA2]">
                    <GitFork className="h-6 w-6" />
                  </div>
                  <div className="text-lg font-semibold text-slate-800">Connected</div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-widest text-slate-500">GIT Integration</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  )
}