
노션 링크 백업 (별도 오픈 X, 백업용)

https://www.notion.so/TypeScript-2a877de2a04280dbbf23d46e930ffd40

### 싸피 깃 업로드 위한 일부 내용 발췌, 이미지 모두 생략

### 인프런 한 입 크기로 잘라먹는 타입스크립트 수강 일지

# 타입 스크립트의 기본 타입


### 타입 트리 이미지

각각의 타입들은 서로 부모와 자식 관계를 이루며 계층 형성

또 실습하기 전에 npm init으로 노드 js 패키지 초기화 하고

npm i types node

npm i types node

tsconfig.json  만들고 옵션 설정 

```json
{

"compilerOptions": {
    "target":"esnext",
    "module": "esnext",
    "outDir": "dist",
    "strict": true,
    "moduleDetection": "force", 
},

"include": ["src"]

}
```

하고 ts 파일 만들고 tsx로 변환시켜보자 

```tsx
console.log("Hello new Project")
```

```jsx
console.log("Hello new Project");
export {};
```

저거 바로 노드로 실행하면

이거 뜨는데 타입 모듈 설정 안해서 그럼 (난몰라요 시전함)

패키지 파일 가서 해주고

실행하면 잘나옴

tsnode 설정 

tsnode 옵션 만든 다음에 “esm”: true 설정하면 된다 

# 원시 타입(Primitive Type)

**⇒ 동시에 딱 하나의 값만 저장하는 타입** 

### **number**

```tsx
//number 
let num1 : number = 123;

// 변수의 이름 뒤에 콜론을 쓰고 타입을 작성해서 변수의 타입을 정의하는 이런 문법을
// type 주석 또는 type annotation(어노테이션)
// ts에서 변수 타입을 정의하는 가장 기본적인 방식 
// 양수, 음수, 소수, 움의 소수 전부 표현 가능
// Infinity(양의 무한대) -Infinity(음의 무한대), NaN(Not a Number)도 사용 가능

// 문자열 메서드 같은거 당연히 못쓰고, 숫자 메서드는 당연히 쓸 수 있게 해줌
```

### **stirng**

```tsx
//string 
let str1 : string = "hello";
let str2 : string = 'hello';
let str3 : string = `hello`;
let str4 : string = `hello ${num1}`

// 큰따옴표 문자열, 작은 따옴표 문자열, 백틱 문자열, 템플릿 리터럴 문자열 전부 문자열 타입
```

다른거 넣으면 당연히 오류 발생

### **boolean**

```tsx
//boolean 참과 거짓만 저장
let bool1 : boolean = true;
let bool2 : boolean = false;
```

### **null**

```tsx
//null
let null1 : null = null;
// null값 이외에 다른 값을 담을 수 없음
```

### **undefined**

```tsx
//undefined
let unde1 : undefined = undefined;
// 이것도 마찬가지로 다른 값 담을 수 없음
```

중간에 넣을 값이 없어서 잠깐 null이라도 넣어야하는데 어떡하지?

⇒ 컴파일 옵션을 건드리면 잠깐 넣을 수 있게 해주는데

**tsconfig에서 “strictNullChecks”: false로 옵션을 변경하면 된다 (엄격한 null검사 옵션)**

**strict 옵션은 strictNullCheck 옵션의 상위 옵션**

**위에꺼가 켜져 있으면 따로 손대지 않는 이상 자동으로 켜져있다** 

## 리터럴 타입(Literal Type)

**⇒ 값 그 자체가 타입이 되는 경우를 말한다.**

```tsx
// 리터럴 타입 (이거 참 독특한 친구임), 리터럴 -> 값이라는 뜻이라서
//값 그 자체가 타입이 되는 경우를 말함

let numA: 10 = 10;
let strA : "hello" = "hello";
let boolA: true = true;

// 숫자타입도 되고, 문자열도 되고, 불린값도 된다 (원시타입이면 전부 되는듯)
```

그니까 방금 10이라는 값만 허용하는 타입을 만든거임!!

**복합적인 타입을 만들때 굉장히 유용하게 사용하기 때문에,** 

**이렇게 값으로 타입 정의 가능하구나 알아두기만 하면 된다**



# 배열과 튜플 

# 배열

```tsx
//배열 
let numArr :number[] = [1,2,3];
// 배열 요소의 타입을 먼저 정의해주고, 대괄호를 열면 배열의 타입을 정의할 수 있다.

//문자열 배열도
let strArr :string[] = ["hello","I'm","SSEMIM"];

// 이렇게 꺽쇠를 열고 타입을 집어넣는 방식으로도 가능 (제네릭 문법이라고 한다)
let boolArr : Array<boolean> = [true,false,true]

// 배열에 들어가는 요소들의 타입이 다양한 경우
let multiArr: (number | string)[] = [1,"hello"];
// 어떻게 정의하는 지 모르겠다면, 마우스 올려보면 타입스크립트가 지금 어떤 타입으로 추론중인지 알 수 있음
// 소괄호는 요소 타입이고, []는 배열
// String이거나 숫자일 수 있다. 가운데 | 적고 선언하는걸 유니온 타입이라고 한다

//다차원 배열 : 배열안에 배열, 배열안에 배열안에 배열 등등 암튼 겹으로 있는 배열 
let doubleArr : number[][]= [
    [1,2,3],
    [4,5,6],
]
// 차원 수 맞게 대괄호만 추가해주면 된다
```

# 튜플

**: 길이와 타입이 고정된 배열 (JS에는 없음)**

```tsx
// 튜플
// 길이와 타입이 고정된 배열 

let tup1:[number,number] = [1,2];
//tup1 = [1,2,3];
//tup1 = ["1","2"]
```


```tsx
let tup2:[number,string,boolean] = [1,"2",true]
// 순서 바꿔넣거나 길이 바꾸거나 하면 또 에러 뜬다
// 별도로 존재하는 자료형이라기엔 좀 그렇고 사실 그냥 변환하면 배열이긴 해 
// 그래서 push로 밀어넣거나, pop으로 꺼내거나 가능!!
// 배열 메소드 사용할때는 튜플 에러 발생 X, 어차피 JS의 배열이기 때문
// 대신 쓸 때 조심조심 써야함
```


```tsx

// 언제 유용하게 사용하느냐?
// 유저 정보를 2차원으로 저장한 배열을 만들었다고 쳐보자 

const users : [string,number][] = [
    ["김김김",1],
    ["박박박",3],
    ["이이이",2],
    [5,"최최최"],
]
```

**우리가 배열을 사용할 때 인덱스의 위치에 따라서 넣어야 하는 값이 이미 정해져 있고,**

**그 순서를 지키는 게 중요할 때 이렇게 튜플을 사용하면 편하다 (값 잘못 넣는거 방지!)**


# 객체

**오브젝트 타입으로 타입 선언 X** 

```tsx
// object
// 이렇게 지정하는건 객체이긴 한데 그 이상은 모른다는 뜻임
let user : object ={
    id : 1,
    name : "냐냐냐",
}

// 그럼 우찌 해야하나?
// 오브젝트 타입 말고 객체 리터럴 타입을 활용해야함
```

이렇게 오류가 떠버린다…

**객체 리터럴 타입으로 타입 선언 O**

```tsx
let user : {
    id :number;
    name : string;
}

// 이렇게 중괄호를 열어서 안에 들어있는거까지 어떤 타입인지 알려주는 것을 
//객체 리터럴 타입이라고 한다

```

```tsx
let user : {
    id :number;
    name : string;
} = {
    id : 1,
    name : "냐냐냐",
 }

```

그러면 이제 사용 가능! 

```tsx

let dog :{
    name:string;
    color:string;
}= {
    name: "돌돌이",
    color: "brown",
};

```

프로퍼티를 이렇게 다 전개해서 써야 하는 요상한 문법이지만 

**구조를 기준으로 타입을 정의하는데, 이걸 구조적 Type시스템이라고 한다** 

**프로퍼티 기반 타입 시스템**이라고 부르기도 한다

반대로 **이름 만으로 타입**을 정하는 건 **명목적 타입 시스템**이라고 부름 

명목적 타입 시스템 (대부분의 다른 언어는 이걸 씀)

```tsx
let user : {
    id? :number;
    name : string;
} = {
    id : 1,
    name : "냐냐냐",
}

```

변수에 프로퍼티가 **있어도 되고 없어도 되는 프로퍼티**인 경우에는
뒤에 **?** **물음표** 하나만 추가해주면 된다.

프로퍼티가 있어도 되고 없어도 된다는 뜻인데, 만약 있다면 

타입은 해당 타입이다라는 뜻

이렇게 ? 가 붙어있는 프로퍼티를 

**선택적 프로퍼티 / 옵셔널 프로퍼티**라고 한다

```tsx

let config : {
    apiKey :string
} =  {
    apiKey : "MY_API_KEY"
}
```

이렇게 바꾸면 안될 것 같은 값을 넣을때는?

**readonly를 붙여서!** 

**값이 바뀌는 걸 막아준다**

```tsx

let config : {
    readonly apiKey :string
} =  {
    apiKey : "MY_API_KEY"
}
```

*** 이하략 ***