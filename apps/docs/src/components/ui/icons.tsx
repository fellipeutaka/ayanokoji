export type IconProps = React.ComponentProps<"svg">;
export type Icon = (props: IconProps) => React.JSX.Element;

export const Icons = {
  Biome: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={32}
      height={32}
      viewBox="0 0 16 16"
      role="presentation"
      {...props}
    >
      <path
        className="[--stroke-rich:#8aadf4]"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.538 12.543C4.37 11.165 5.328 10.297 8 11l.5-2.5c-1.897-.447-4.05-.218-5.58.991a6.38 6.38 0 00-2.42 5h15L8 1.51 5 6.5"
      />
    </svg>
  ),
  Docker: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={32}
      height={32}
      viewBox="0 0 16 16"
      role="presentation"
      {...props}
    >
      <path
        className="[--stroke-rich:#8aadf4]"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M.5 8.5H11l.75-.5a5.35 5.35 0 010-3.5c1 .6 1 1.88 1.74 2 .77-.09 1.23.01 2 .52 0 0-.97 1.77-2.5 1.98-1.93 3.65-4.5 5.5-6.98 5.5C0 14.5.5 8.5.5 8.5m1 0v-2m0 0h8m-6 2v-4m0 0h4m-2-2h2m-2 6v-6m2 6v-6m2 6v-2"
      />
    </svg>
  ),
  Drizzle: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={32}
      height={32}
      viewBox="0 0 24 24"
      role="presentation"
      {...props}
    >
      <path
        className="[--fill-rich:#c5f74f]"
        fill="currentColor"
        d="M6.46 11.852a.863.863 0 00-.328-1.185.886.886 0 00-1.198.333l-2.819 4.918a.863.863 0 00.329 1.185.886.886 0 001.198-.332zm6.076-3.771a.863.863 0 00-.328-1.185.886.886 0 00-1.199.332l-2.818 4.919a.863.863 0 00.328 1.185A.886.886 0 009.718 13zm9.349 0a.863.863 0 00-.329-1.185.886.886 0 00-1.198.332l-2.819 4.919a.863.863 0 00.329 1.185.886.886 0 001.198-.332zm-6.078 3.771a.863.863 0 00-.328-1.185.886.886 0 00-1.199.333l-2.818 4.918a.863.863 0 00.328 1.185.886.886 0 001.199-.332z"
      />
    </svg>
  ),
  ExternalLink: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="presentation"
      {...props}
    >
      <path d="M15 3h6v6M10 14L21 3M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    </svg>
  ),
  Git: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={32}
      height={32}
      viewBox="0 0 16 16"
      role="presentation"
      {...props}
    >
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path
          className="[--stroke-rich:#cad3f5]"
          stroke="currentColor"
          d="M8.5 10.5a1 1 0 01-1 1 1 1 0 01-1-1 1 1 0 011-1 1 1 0 011 1m0-6a1 1 0 01-1 1 1 1 0 01-1-1 1 1 0 011-1 1 1 0 011 1m3 3a1 1 0 01-1 1 1 1 0 01-1-1 1 1 0 011-1 1 1 0 011 1m-4-2v4m-1-6l-1-1m4 4l-1-1"
        />
        <path
          className="[--stroke-rich:#f5a97f]"
          stroke="currentColor"
          d="M9.06 1.06l5.88 5.88a1.5 1.5 0 010 2.12l-5.88 5.88a1.5 1.5 0 01-2.12 0L1.06 9.06a1.5 1.5 0 010-2.12l5.88-5.88a1.5 1.5 0 012.12 0"
        />
      </g>
    </svg>
  ),
  Key: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={32}
      height={32}
      viewBox="0 0 16 16"
      role="presentation"
      {...props}
    >
      <g
        fill="none"
        className="[--stroke-rich:#cad3f5]"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 10.5a4.5 4.5 0 10-4.02-2.48L1.5 12.5v2h2v-2h2v-2h2l.48-.48c.6.3 1.3.48 2.02.48" />
        <path d="M12 5a1 1 0 01-1 1 1 1 0 01-1-1 1 1 0 011-1 1 1 0 011 1" />
      </g>
    </svg>
  ),
  Logo: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 36 36"
      role="presentation"
      {...props}
    >
      <circle
        className="[--fill-rich:#FFCC4D]"
        fill="currentColor"
        cx={18}
        cy={18}
        r={18}
      />
      <path
        className="[--fill-rich:#664500]"
        fill="currentColor"
        d="M27.335 23.629a.501.501 0 00-.635-.029c-.039.029-3.922 2.9-8.7 2.9-4.766 0-8.662-2.871-8.7-2.9a.5.5 0 00-.729.657C8.7 24.472 11.788 29.5 18 29.5s9.301-5.028 9.429-5.243a.499.499 0 00-.094-.628z"
      />
      <path
        className="[--fill-rich:#65471B]"
        fill="currentColor"
        d="M18 26.591c-.148 0-.291-.011-.438-.016v4.516h.875v-4.517c-.145.005-.289.017-.437.017z"
      />
      <path
        className="[--fill-rich:#fff]"
        fill="currentColor"
        d="M22 26c.016-.004-1.45.378-2.446.486-.366.042-.737.076-1.117.089v4.517H20c1.1 0 2-.9 2-2V26zm-8 0c-.016-.004 1.45.378 2.446.486.366.042.737.076 1.117.089v4.517H16c-1.1 0-2-.9-2-2V26z"
      />
      <path
        className="[--fill-rich:#65471B]"
        fill="currentColor"
        d="M27.335 23.629a.501.501 0 00-.635-.029c-.03.022-2.259 1.668-5.411 2.47-.443.113-1.864.43-3.286.431-1.424 0-2.849-.318-3.292-.431-3.152-.802-5.381-2.448-5.411-2.47a.501.501 0 00-.729.657c.097.162 1.885 3.067 5.429 4.481v-1.829c-.016-.004 1.45.378 2.446.486.366.042.737.076 1.117.089.146.005.289.016.437.016.148 0 .291-.011.438-.016.38-.013.751-.046 1.117-.089.996-.108 2.462-.49 2.446-.486v1.829c3.544-1.414 5.332-4.319 5.429-4.481a.5.5 0 00-.095-.628zm-.711-9.605c0 1.714-.938 3.104-2.096 3.104-1.157 0-2.096-1.39-2.096-3.104s.938-3.104 2.096-3.104c1.158 0 2.096 1.39 2.096 3.104zm-17.167 0c0 1.714.938 3.104 2.096 3.104 1.157 0 2.096-1.39 2.096-3.104s-.938-3.104-2.096-3.104c-1.158 0-2.096 1.39-2.096 3.104z"
      />
      <path
        className="[--fill-rich:#292F33]"
        fill="currentColor"
        d="M34.808 9.627c-.171-.166-1.267.274-2.376-.291-2.288-1.166-8.07-2.291-11.834.376-.403.285-2.087.333-2.558.313-.471.021-2.155-.027-2.558-.313-3.763-2.667-9.545-1.542-11.833-.376-1.109.565-2.205.125-2.376.291-.247.239-.247 1.196.001 1.436.246.239 1.477.515 1.722 1.232.247.718.249 4.958 2.213 6.424 1.839 1.372 6.129 1.785 8.848.238 2.372-1.349 2.289-4.189 2.724-5.881.155-.603.592-.907 1.26-.907s1.105.304 1.26.907c.435 1.691.351 4.532 2.724 5.881 2.719 1.546 7.009 1.133 8.847-.238 1.965-1.465 1.967-5.706 2.213-6.424.245-.717 1.476-.994 1.722-1.232.248-.24.249-1.197.001-1.436zm-20.194 3.65c-.077 1.105-.274 3.227-1.597 3.98-.811.462-1.868.743-2.974.743h-.001c-1.225 0-2.923-.347-3.587-.842-.83-.619-1.146-3.167-1.265-4.12-.076-.607-.28-2.09.388-2.318 1.06-.361 2.539-.643 4.052-.643.693 0 3.021.043 4.155.741 1.005.617.872 1.851.829 2.459zm16.278-.253c-.119.954-.435 3.515-1.265 4.134-.664.495-2.362.842-3.587.842h-.001c-1.107 0-2.163-.281-2.975-.743-1.323-.752-1.52-2.861-1.597-3.966-.042-.608-.176-1.851.829-2.468 1.135-.698 3.462-.746 4.155-.746 1.513 0 2.991.277 4.052.638.668.228.465 1.702.389 2.309z"
      />
    </svg>
  ),
  Prisma: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={32}
      height={32}
      viewBox="0 0 16 16"
      role="presentation"
      {...props}
    >
      <path
        className="[--stroke-rich:#8bd5ca]"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 .5l6.5 12.05-10 2.95-3-5zm-3.5 15L8 .5"
      />
    </svg>
  ),
  TypeScript: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={32}
      height={32}
      viewBox="0 0 16 16"
      role="presentation"
      {...props}
    >
      <g
        className="[--stroke-rich:#8aadf4]"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 1.5h8A2.5 2.5 0 0114.5 4v8a2.5 2.5 0 01-2.5 2.5H4A2.5 2.5 0 011.5 12V4A2.5 2.5 0 014 1.5" />
        <path d="M12.5 8.75c0-.69-.54-1.25-1.2-1.25h-.6c-.66 0-1.2.56-1.2 1.25S10.04 10 10.7 10h.6c.66 0 1.2.56 1.2 1.25s-.54 1.25-1.2 1.25h-.6c-.66 0-1.2-.56-1.2-1.25m-3-3.75v5M5 7.5h3" />
      </g>
    </svg>
  ),
} as const satisfies Record<string, Icon>;
