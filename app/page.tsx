import Image from "next/image";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { FaEnvelope, FaLinkedinIn, FaPhoneVolume } from "react-icons/fa";
import DocumentActions from "@/components/DocumentActions";
import SignOutButton from "@/components/SignOutButton";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <section className="min-h-screen bg-[#eeeeee] px-3 py-0 text-[#f7f1ef] sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center gap-8">
        <div className="flex w-full justify-end">
          <SignOutButton />
        </div>
        <article className="relative grid aspect-[900/620] w-full max-w-[1400px] grid-cols-[42.1%_57.9%] overflow-hidden border-t-2 border-[#ff9589] bg-[#30303e] shadow-[18px_22px_22px_rgba(0,0,0,0.32)] sm:aspect-[900/486]">
          <div className="relative bg-white">
            <div className="relative h-full overflow-hidden bg-white">
              <Image
                src="/pp.png"
                alt="Profile portrait"
                fill
                priority
                className="object-cover object-[center_18%]"
              />
            </div>
          </div>

          <div className="relative bg-[#30303e] px-[5.33%] py-[4.45%]">
            <div className="absolute right-[18.9%] top-0 h-[67.5%] w-[3px] bg-[#ff9589]" />
            <p className="ml-1 text-[clamp(14px,4vw,36px)] font-light uppercase leading-[0.98] tracking-[0.15em] text-[#ff9589]">
              Harishankar
              <br />
              <span className="text-[clamp(15px,4.33vw,39px)] font-black tracking-[0.08em] text-[#ff6f62]">
                Chaudhary
              </span>
            </p>

            <div className="mt-[clamp(38px,14.65vw,132px)] space-y-[clamp(7px,3.1vw,28px)] pl-2 text-[clamp(5px,1.5vw,15px)] font-black uppercase tracking-[0.08em] text-white">
              <div className="flex items-center gap-[clamp(8px,2.67vw,24px)]">
                <FaPhoneVolume className="h-[clamp(11px,3vw,27px)] w-[clamp(11px,3vw,27px)] text-[#ff9589]" />
                <span>Mobile No. +977 9841234567</span>
              </div>
              <div className="flex items-center gap-[clamp(8px,2.67vw,24px)]">
                <FaEnvelope className="h-[clamp(11px,3vw,27px)] w-[clamp(11px,3vw,27px)] text-[#ff9589]" />
                <span>DOB: 1982 May 19</span>
              </div>
              <div className="flex items-center gap-[clamp(8px,2.67vw,24px)]">
                <span className="flex h-[clamp(11px,3vw,27px)] w-[clamp(11px,3vw,27px)] items-center justify-center text-[clamp(10px,2.67vw,24px)] font-black text-[#ff9589]">
                  ♂
                </span>
                <span>Gender: Male</span>
              </div>
              <div className="flex items-center gap-[clamp(8px,2.67vw,24px)]">
                <FaLinkedinIn className="h-[clamp(11px,3vw,27px)] w-[clamp(11px,3vw,27px)] text-[#ff9589]" />
                <span>Bachhanpurwa-7, Bara</span>
              </div>
            </div>

            <div className="absolute right-[2%] top-[4.1%] text-[clamp(8px,2.33vw,21px)] font-black uppercase tracking-[0.45em] [writing-mode:vertical-rl]">
              Nepal
            </div>
          </div>

          <div className="absolute bottom-0 left-0 h-[6.38%] w-full bg-[#ff9589]" />
        </article>

        <article className="grid aspect-[900/620] w-full max-w-[1400px] grid-cols-[58.5%_41.5%] overflow-hidden bg-[#30303e] shadow-[18px_22px_22px_rgba(0,0,0,0.32)] sm:aspect-[900/486]">
          <div className="relative bg-[#30303e] px-[4%] py-[4%]">
            <p className="text-[clamp(13px,2.78vw,25px)] font-light uppercase leading-[0.92] tracking-[0.06em] text-[#ff8f84]">
              Harishankar
              <br />
              <span className="font-extrabold text-[#ff6f62]">Chaudhary</span>
            </p>
            <p className="mt-[clamp(8px,2.22vw,20px)] max-w-[42%] text-[clamp(5px,1vw,9px)] font-semibold italic leading-[1.35] tracking-[0.05em] text-[#ff9589]">
              Male • District Bara
              <br />
              Permanent address: Bachhanpurwa-7
            </p>

            <div className="mt-[clamp(18px,6.56vw,59px)] h-[2px] w-[42%] bg-[#ff7f73]" />
            <p className="mt-[clamp(10px,3.56vw,32px)] text-[clamp(7px,1.56vw,14px)] font-medium tracking-[0.07em] text-white">
              Verified personal information
            </p>
          </div>

          <div className="flex flex-col items-center justify-center bg-[#ff9589] px-[3.5%] text-[#20202b]">
            <div className="grid h-[clamp(42px,12vw,108px)] w-[clamp(42px,12vw,108px)] grid-cols-5 grid-rows-5 gap-[clamp(2px,0.56vw,5px)] bg-white p-[clamp(4px,1vw,9px)]">
              {Array.from({ length: 25 }).map((_, index) => (
                <span
                  key={index}
                  className={[
                    0, 1, 2, 4, 5, 7, 9, 10, 12, 13, 15, 16, 18, 20, 21,
                    22, 23,
                  ].includes(index)
                    ? "bg-[#30303e]"
                    : "bg-transparent"}
                />
              ))}
            </div>
            <p className="mt-[clamp(10px,3.1vw,28px)] text-[clamp(5px,1.11vw,10px)] font-black uppercase tracking-[0.14em]">
              harishankarchaudhary.com
            </p>
          </div>
        </article>

        <DocumentActions />
      </div>
    </section>
  );
}
