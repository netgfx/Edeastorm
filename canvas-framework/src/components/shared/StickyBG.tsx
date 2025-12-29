const StickyBG = (props: any) => (
  <svg
    width={181}
    height={201}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g opacity={0.5} filter="url(#a)">
      <ellipse cx={90.5} cy={176.641} rx={74.375} ry={13.359} fill="#000" />
    </g>
    <g filter="url(#b)">
      <path fill={props.bgcolor || "#fff"} d="M3 0h175v178.125H3z" />
    </g>
    <defs>
      <filter
        id="a"
        x={5.172}
        y={152.328}
        width={170.656}
        height={48.625}
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feGaussianBlur
          stdDeviation={5.477}
          result="effect1_foregroundBlur_920_12586"
        />
      </filter>
      <filter
        id="b"
        x={0.262}
        y={0}
        width={180.477}
        height={183.602}
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={2.738} />
        <feGaussianBlur stdDeviation={1.369} />
        <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
        <feBlend
          in2="BackgroundImageFix"
          result="effect1_dropShadow_920_12586"
        />
        <feBlend
          in="SourceGraphic"
          in2="effect1_dropShadow_920_12586"
          result="shape"
        />
      </filter>
    </defs>
  </svg>
);

export default StickyBG;
