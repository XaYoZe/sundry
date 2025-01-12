# 彈窗插件
用来统一控制弹窗，toast

## 使用
弹窗组件建议放一个文件夹内，以Popup开头

1. 在活動下js/index.ts下引入插件
   ```javascript
    import { createApp } from 'vue'
    import App from '../layout/index.vue'
    import PopupCtrl, {PopupConfig} from 'CMT/PopupCtrl';
    
    // ···
    const app = createApp(App);
    // 在配置中寫入配置會添加默認配置到inject('PopupStore')中
    app.use(PopupCtrl)
      .mount('#app')
    
    ```

2. 在layout/index.vue使用组件
    ```html
    <template>
      ···
      <Teleport to="body">
        <PopupCtrl></PopupCtrl>
      </Teleport>
    </template>
    ```

3. 在组件中打开弹窗
    + PopupName.vue 彈窗組件文件
    ```html
    <template>
      <!-- 直接使用參數名 -->
      {{ id }}
      ···
    </template>
    <script setup>
    
    // 使用defineProps接收彈窗數據
    const $props = defineProps({
      id: {} // 接收傳輸數據
    });
    console.log($props.id);
    
    // 使用defineEmits觸發彈窗回調
    const $emit = defineEmits(['confirm', 'close']);
    
    // 觸發打開彈窗是註冊的onConfirm事件
    $emit('confirm', 1);
    // 默認關閉當前彈窗, 如果註冊了onClose事件則需要手動關閉彈窗
    $emit('close');
    
    </script>
    ```
    + 在其它.vue文件
    ```html
    <template>
      ···
    </template>
    <script setup>
    import { inject } from 'vue';
    
    // 引用popupStore
    const popupStore = inject('popupStore');
    
    // 打開名字傳輸數據id:1註冊confirm事件的PopupName的窗口
    popupStore.open('PopupName', {id: 1}).onConfirm(() => {
    
    });
    
    </script>
    ```
4. 关闭弹窗  
   1. 在打开弹窗的关闭弹窗
   ```html
    <template>
      ···
    </template>
    <script setup>
    import { inject } from 'vue';
    
    // 引用popupStore
    const popupStore = inject('popupStore');
    
    // 打開名字傳輸數據id:1註冊confirm事件的PopupName的窗口
    // 注意：如果注册onClose方法需要自己手动关闭窗口，使用popupStore.close() || popup.close()
    const popup = popupStore.open('PopupName', {id: 1});

    popup.close(); // 关闭弹窗方式1
    popupStore.close(); // 关闭弹窗方式2, 可传弹窗id关闭指定弹窗
    
    </script>
   ```
   2. 在弹窗组件内关闭弹窗
   ```html
    <template>
      ···
    </template>
    <script setup>
    import { inject } from 'vue';
    
    // 注意：如果打开时注册onClose方法，该方式会被onClose拦截，或者使用popupStore.close()
    const $emit = defineEmits(['close']);


    // 引用popupStore
    const popupStore = inject('popupStore');
    
    popupStore.close(); // 该方法不会触发注册的onClose事件
    
    </script>
   ```


## 配置

### 彈窗配置
1. 在use時傳入彈窗配置
    ```javascript
    import { createApp } from 'vue'
    import App from '../layout/index.vue'
    import PopupCtrl, {PopupConfig} from 'CMT/PopupCtrl';
    
    // ···
    const app = createApp(App);
    // 在配置中寫入配置會添加默認配置到inject('PopupStore')中
    // 例: 下列配置maskClose: true, 在使用inject('popupStore').open打開的所有窗口都可以點擊遮罩關閉
    app.use<PopupConfig>(PopupCtrl, {maskClose: true})
      .mount('#app')
    
    ```
2. 在usePopupStore時傳入配置
    ```javascript
    import  { usePopupStore } from 'CMT/PopupCtrl';
    
    // ···
    // 例: 下列配置maskClose: true, 在使用popupStore.open打開的所有窗口都可以點擊遮罩關閉
    const popupStore = usePopupStore({maskClose: true});
    popupStore.open('test')
    ```
3. 在打開彈窗時傳入配置
    ```javascript
    import  { usePopupStore } from 'CMT/PopupCtrl';
    
    // ···
    // 只有該次彈窗生效
    const popupStore = usePopupStore();
    popupStore.open('test', {}, {maskClose: true})
    // or
    popupStore.open('test').config({maskClose: true})
    // or
    popupStore.config({maskClose: true}).open('test')
    ```

### popupStore 方法

---
1. `open(popupName[, popupData, popupConfig]):PopupObject`  
  弹出窗口
    - popupName: String 弹窗组件名， 可带参数如：popupName?id=1
    - popupData: Object 弹窗数据 已props的方式给弹窗组件
    - popupConfig: Object 弹窗配置，见 PopupConfig
    ```ts
    interface PopupConfig { 
      /** 只能存在一個相同彈窗 */
      only?: boolean
      /** 動畫效果 */
      anime?: 'bounce' | 'bottom',
      /** 透明度 */
      opacity?: number
      /** 層級 */
      zIndex?: number,
      /** 點擊遮罩關閉 */
      maskClose?: boolean, 
      /** 外层弹窗容器类名 */
      rootClassName?: string,
      /** 遮罩樣式 */
      maskStyle?: StyleValue
    }
    ```
    彈窗結構體
    ```ts
    class PopupObject {
      static deepMerge(target, source):object
      /** 彈窗id */
      id: number
      /** 弹窗名称 */
      name = ''
      /** 弹窗数据 */
      data: object = {}
      /** 彈窗組件 */
      ref: null
      /** 配置 */
      option:PopupConfig
      /**
       * 註冊監聽$emit事件, 觸發在組件上使用$emit('事件名')觸發事件, 沒有callback返回promise
       * @param event 事件名
       * @param callback 事件回調
       * @returns { PopupObject } 彈窗對象
       */
      on (event: string):Promise
      on (event: string, callback: () => any):this
      /**
       * 移除監聽$emit事件
       * @param event 事件名
       * @param callback 註冊的回調
       * @returns { PopupObject } 彈窗對象
       */
      un (event: string, callback):this

      /** 手動關閉窗口 */
      close: () => void
      /** 
       * 傳組件數據
       * @param {Props<Name>} props 組件數據
       */
      props (props: Props<Name>):this
      /** 
       * 設置彈窗配置
       * @param {PopupConfig} config 彈窗配置
       */
      config (config: PopupConfig):this
    }
    ```
---
2. `bottom(popupName[, popupData, popupConfig])`  
    窗口从底部弹出
    + 参数同open
---
3. `daily(popupName[, popupData, popupConfig])`  
    窗口每天只弹一次，如需要根据不同id，拼接参数在弹窗名后面里：popupName?id=1000000  
    > 在弹窗组件内使用`$emit('show', boolean)`使用控制是否显示true：显示，false：不显示
    + 参数同open
--- 
4. `once(popupName[, popupData, popupConfig])`  
    活动只弹一次，如需要根据不同id，拼接参数在弹窗名后面里：popupName?id=1000000
    > 在弹窗组件内使用`$emit('show', boolean)`使用控制是否显示true：显示，false：不显示
    + 参数同open
--- 
5. `only(popupName[, popupData, popupConfig])`  
    同名組件只能存在一個，如需要根据不同id，拼接参数在弹窗名后面里：popupName?id=1000000
    + 参数同open
--- 
6. `once(popupName[, popupData, popupConfig])`  
    活动只弹一次，如需要根据不同id，拼接参数在弹窗名后面里：popupName?id=1000000
    > 在弹窗组件内使用`$emit('show', boolean)`使用控制是否显示true：显示，false：不显示
    + 参数同open
--- 
7. `close([popupId])`  
    关闭弹窗，默认关闭最后一个弹窗，该方法不会触发注册的onClose事件
    + popupId: 可选，弹窗id 
---
8. `toast(text[, toastConfig] )`  
    弹出toast
    + text String 文本
    + toastConfig ToastConfig 可选，toast配置
    ```ts
    interface ToastConfig {
      /** 持續時間 毫秒 默认3000 */
      duration?: number
    }
    ```

9. `props(props)`  
    設置下個彈窗數據
    + props PropsValue 彈窗數據
    ```

10. `config(config)`  
    設置下個彈窗數據
    + config PopupConfig 彈窗配置
    ```

### 弹窗数据交互

1. 获取数据   
  使用`defineProps`在弹窗组件中获取传输的数据
  + 其它组件
    ```html
    <template>
      ···
    </template>
    <script setup>
      import { inject } from 'vue';

      // 引入
      const popupStore = inject('popupStore');

      // 打开弹窗并携带数据{id: 1}
      popupStore.open(popupName, {id: 1, name: 'a'})
      // or
      popupStore.open(popupName).props({id: 1, name: 'a'})

    </script>
    ```

  + 弹窗组件
    ```html
    <template>
      ···
    </template>
    <script setup>
      // 在组件中使用defineProps获取数据
      const $props = defineProps({
        id: {} // 获取在其它组件中传过来的id;
        name: {} // 获取在其它组件中传过来的name;
      });
      // 传输过来的id
      console.log($props.id) // 1
      // 传输过来的name
      console.log($props.name) // a
    </script>
    ```

2. 触发回调  
    1. 注册事件
    在打开弹窗时使用on注册回调事件，例：
    ```html
    <template>
      ···
    </template>
    <script setup>
      import { inject } from 'vue';

      const popupStore = inject('popupStore');

      // 監聽組件內$emit('confirm')的事件
      // 沒有傳入回調時返回promise對象
      popupStore.open(popupName).on('confirm').then(data => {
        console.log(data); // {id: 1}
      }).finally(() => {
        popupStore.close()
      })

      // or 有回調時觸發事件
      popupStore.open(popupName).on('confirm', (data) => {
        // ···
        console.log(data); // {id: 1}
      }).on('close', (cb) => { // 注意：如果注册close方法需要自己手动关闭窗口，使用popupStore.close() || popup.close()
        // 关闭弹窗 
        cb();
      });
    </script>
    ```
    2. 触发事件   
    在弹窗组件中使用`defineEmits`来触发注册的事件，例：
    ```html
    <template>
      ···
    </template>
    <script setup>

      const $emit = defineEmits(['confrim']);
      // 触发onConfirm事件
      $emit('confirm', {id: 1});
    </script>
    ```
    3. 获取组件实例
    ```html
    <template>
      ···
    </template>
    <script setup>
      import { inject } from 'vue';

      const popupStore = inject('popupStore');
      // 组件实例
      popupStore.open(popupName).ref
    </script>
    ```

3. 类型提示
  在项目文件夹下添加popup.d.ts文件能够给弹窗方法增加参数提示，
  例如：open(popupName, popupData).on('event').ref 
  + popupName 能提示已有弹窗组件名字
  + popupData 能提示defineProps的参数
  + event 能提示defineEmit的方法名
  + ref 组件实例
  ```ts
    declare module 'CMT/PopupCtrl' {
      export interface PopupComponent {
        /** 購買等級 */
        'PopupBuyLevel': typeof import('./PopupBuyLevel.vue')['default'];
        /** 活动结束 */
        'PopupActEnd': typeof import('./PopupActEnd.vue')['default'];
        /** 選擇等級 */
        'PopupBuyLevelConfirm': typeof import('./PopupBuyLevelConfirm.vue')['default'];
      }
    }
    export { }
  ```
