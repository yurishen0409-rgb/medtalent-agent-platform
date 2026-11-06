import { Fragment } from "react";
import { BellRingingIcon, BookOpenIcon, CalendarCheckIcon, CigaretteSlashIcon, UsersThreeIcon, PillIcon, ChatTextIcon, MapPinIcon, ChartBarIcon, CheckCircleIcon, ClipboardTextIcon, DotsThreeCircleIcon, FileMagnifyingGlassIcon, FirstAidKitIcon, HeadsetIcon, LeafIcon, MoonIcon, PrescriptionIcon, SmileyIcon, SquaresFourIcon, StethoscopeIcon, UserListIcon, type Icon } from "@phosphor-icons/react";
import type { DoctorCustom } from "./doctorCustom";

const icons: Record<string, Icon> = {
  症状记录: ClipboardTextIcon, 资料库: BookOpenIcon,
  今日心境: SmileyIcon, 健康宣教: BookOpenIcon, 家属照护: UsersThreeIcon, 量表自评: ChartBarIcon, 放松训练: LeafIcon, 用药记录: PillIcon, 戒烟管理: CigaretteSlashIcon, 门诊指引: MapPinIcon, 留言咨询: ChatTextIcon, 病友信息: UserListIcon, 人工咨询: HeadsetIcon, 科普宣教: BookOpenIcon, 量表测试: ChartBarIcon, 报告解读: FileMagnifyingGlassIcon, 检查报告解读: FileMagnifyingGlassIcon,
  睡眠日记: MoonIcon, 情绪预警: BellRingingIcon, 放松练习: LeafIcon, 就诊准备: ClipboardTextIcon, 练习打卡: CheckCircleIcon, 预约挂号: CalendarCheckIcon,
  复诊开方: PrescriptionIcon, 报告查询: FirstAidKitIcon, 更多服务: DotsThreeCircleIcon, 耳鼻喉症状自查: StethoscopeIcon, 术后康复指导: FirstAidKitIcon, 过敏季提醒: BellRingingIcon,
};

export default function TangFeatureGrid({ groups, onOpen, itemIcons, splitLabel }: { groups: DoctorCustom["featureGroups"]; onOpen: (action: string) => void; itemIcons?: Record<string, Icon>; splitLabel?: (label: string) => { section?: string; short: string } }) {
  return (
    <section className="tang-feature-grid" aria-label="功能入口">
      {groups.map(group => (
        <div key={group.title} className="tang-feature-group">
          <h2>{group.title}</h2>
          {group.description && <p>{group.description}</p>}
          {[...new Set(group.items.map(label => splitLabel?.(label).section))].map(section => <Fragment key={section || "all"}>
            {section && <h3>{section}</h3>}
            <div>
              {group.items.filter(label => splitLabel?.(label).section === section).map(label => {
                const ItemIcon = itemIcons?.[label] || icons[label] || SquaresFourIcon;
                const short = splitLabel?.(label).short || label;
                return <button key={label} type="button" aria-label={short === label ? undefined : label} onClick={() => onOpen(label)}><span><ItemIcon size={22} weight="duotone" /></span><b>{short}</b></button>;
              })}
            </div>
          </Fragment>)}
        </div>
      ))}
    </section>
  );
}
