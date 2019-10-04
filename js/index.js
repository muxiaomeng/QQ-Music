$(function (argument) {
	//自定义滚动条初始化
	// $(".body_list").mCustomScrollbar();
	

	var $audio = $("audio");
	var player = new Player($audio);

	//加载歌曲列表
	getMusicList();
	function getMusicList() {
		$.ajax({
			url:"./source/musiclist.json",
			dateType: "json",
			success:function (date) {
				player.musiclist = $.parseJSON(date);
				var musiclist = $(".body_list ul");
				//遍历获取的数据
				$.each($.parseJSON(date),function(index,ele) {
					var music = createMusic(index,ele);
					
					musiclist.append(music);
				});
				initMusicInfo($.parseJSON(date)[0]);
				initMusicLyric($.parseJSON(date)[0]);
			},
			error:function(error) {
				console.log(error);
			}
		});
	}

	//初始化歌曲信息
	function initMusicInfo(music) {
		//获取对应的元素
		var $musicImg = $(".song_info_pic>img");
		var $musicName = $(".song_info_name>a");
		var $musicSinger = $(".song_info_singer>a");
		var $musicAlbum = $(".song_info_album>a");
		var $musicProName = $(".music_progress_name");
		var $musicProTime = $(".music_progress_time");
		var $musicBg =$(".bg_color");

		//给对应的元素赋值
		$musicImg.attr("src",music.cover);
		$musicName.text(music.name);
		$musicSinger.text(music.singer);
		$musicAlbum.text(music.album);
		$musicProName.text(music.name+" / " +music.singer);
		$musicProTime.text("00:00 / " +music.time);
		$musicBg.css("background","url('"+music.cover+"')");
	}
	//初始化歌词信息
	var lyric;
	function initMusicLyric(music) {
		lyric = new Lyric(music.link_lrc);
		var $song_lyric = $(".song_lyric");
		//清空上一首音乐的li
		$song_lyric.html("");
		lyric.loadLyric(function() {
			$.each(lyric.lyrics,function(index,ele) {
				var $item = $("<li>"+ele+"</li>")
				$song_lyric.append($item);
			})
		});
	}
	//初始化进度条
	var voiceProgress;
	var progress;
	initProgress();
	function initProgress() {
		//获取音乐进度条信息，创建Progress对象
		var $voiceBottom = $(".music_voice_bottom");
		var $voiceLine = $(".music_voice_line");
		var $voiceDot = $(".music_voice_dot");
		voiceProgress = Progress($voiceBottom,$voiceLine, $voiceDot);

		voiceProgress.progressClick(function(value) {
			player.musicVoiceSeekTo(value);
		});
		voiceProgress.progressMove(function(value) {
			player.musicVoiceSeekTo(value);
		});

		//获取歌曲进度条信息，创建Progress对象
		var $progressBottom = $(".music_progress_bottom");
		var $progressLine = $(".music_progress_line");
		var $progressDot = $(".music_progress_dot");
		progress = Progress($progressBottom,$progressLine, $progressDot);
		progress.currentIndex = -1;
		progress.progressClick(function(value) {
			// if(player.currentIndex==-1)return;
			player.musicSeekTo(value);
			lyric.indexSeekTo(player.audio.duration*value);
		});
		progress.progressMove(function(value) {
			player.musicSeekTo(value);
			lyric.indexSeekTo(player.audio.duration*value);
		});
	}
	//初始化事件
	initEvent();
	function initEvent() {
		//监听歌曲的移入移出事件 因为歌曲是后来添加的 必须委托
		$(".body_list").on("mouseenter",".list_music",function() {
			// 展开子菜单 隐藏时长
			$(this).find(".list_menu").stop().show();
			$(this).find(".list_time>a").stop().show();
			$(this).find(".list_time>span").stop().hide();
		});
		$(".body_list").on("mouseleave",".list_music",function() {
			// 隐藏子菜单 显示时长
			$(this).find(".list_menu").stop().hide();
			$(this).find(".list_time>a").stop().hide();
			$(this).find(".list_time>span").stop().show();
		});

		//监听复选框点击事件 同样也要委托
		$(".body_list").on("click",".list_title>.list_check",function(argument) {
			$(this).toggleClass("list_checked");

			if($(this).hasClass("list_checked")){
				$(".list_check").addClass("list_checked");
			}
			else{
				$(".list_check").removeClass("list_checked");
			}
		});
		$(".body_list").on("click",".list_music>.list_check",function(argument) {
			$(this).toggleClass("list_checked");

			$(".list_title>.list_check").addClass("list_checked");
			
			var length = $(".list_music>.list_check").length;
			for(var i = 0;i<length;i++){
				if(!$($(".list_music>.list_check")[i]).hasClass("list_checked")){
					$(".list_title>.list_check").removeClass("list_checked");
					return;
				}
			}
		});

		//监听歌曲上的播放按钮点击事件
		var $mussicplay = $(".music_play");
		$(".body_list").on("click",".list_menu>.list_menu_play",function() {
			var list_music = $(this).parents(".list_music");
			//切换自己的播放图标
			$(this).toggleClass("list_menu_play2");
			//其他播放图标复原
			list_music.siblings().find(".list_menu>.list_menu_play").removeClass("list_menu_play2");
			//切换底部播放图标
			if($(this).hasClass("list_menu_play2")){
				//播放
				$mussicplay.addClass("music_play2");
				//文字高亮
				list_music.find("div").css("color","#fff");
				list_music.siblings().find("div").css("color","rgba(255,255,255,0.5)");
			}
			else{
				//不播放
				$mussicplay.removeClass("music_play2");
				//文字不高亮
				list_music.find("div").css("color","rgba(255,255,255,0.5)");
			}

			//切换序号数字的状态
			list_music.find(".list_number").toggleClass("list_number2");
			list_music.siblings().find(".list_number").removeClass("list_number2");

			//播放音乐
			player.playMusic(list_music[0].index,list_music[0].ele,function(currentIndex) {
				progress.currentIndex = currentIndex;
			});

			//切换歌曲信息
			initMusicInfo(list_music[0].ele);

			//切换歌词信息
			initMusicLyric(list_music[0].ele);
		});

		//监听底部播放按钮
		$mussicplay.click(function() {
			//判断有没有播放过音乐
			if(player.currentIndex==-1){
				//自动触发第一首音乐的点击事件
				$(".list_music").eq(0).find(".list_menu_play").trigger("click");
			}else{
				$(".list_music").eq(player.currentIndex).find(".list_menu_play").trigger("click");
			}
		})
		//监听底部播放上一首按钮
		$(".music_pre").click(function() {
			// alert(player.currentIndex-1); eq为负数的话会从后面数
			$(".list_music").eq(player.currentIndex-1).find(".list_menu_play").trigger("click");
		})
		//监听底部播放下一首按钮 需要特殊处理
		$(".music_next").click(function() {
			// $(".list_music").eq(player.currentIndex+1).find(".list_menu_play").trigger("click");
			$(".list_music").eq(player.nextIndex()).find(".list_menu_play").trigger("click");
		})

		//监听删除按钮
		$(".body_list").on("click",".list_menu_del",function(argument) {
			//找到被点击的音乐
			var $music = $(this).parents(".list_music");

			// 判断删除的音乐是否正在播放
			if($music[0].index ==player.currentIndex){
				$(".music_next").trigger("click");
			}

			$music.remove();
			player.changeMusic($music[0].index);

			//重新排序
			$(".list_music").each(function(index,ele) {
				ele.index = index;
				$(ele).find(".list_number").text(index+1);
			})	
		})

		//监听播放的进度
		player.muiscTimeUpdate(function(currentTime,duration,time) {
			//同步时间
			$(".music_progress_time").text(time);
			//同步进度条
			var value = currentTime/duration *100;
			
			progress.setProgress(value);
			

			//实现歌词同步
			var LyricIndex = lyric.currentIndex(currentTime);
			$(".song_lyric>li").eq(LyricIndex).addClass("cur");
			$(".song_lyric>li").eq(LyricIndex).siblings().removeClass("cur");

			if(LyricIndex<=2) return;
			$(".song_lyric").css({
				marginTop:(-LyricIndex+2)*30
			});

			//一首歌播放完后 播放下一首
			if(value>=100){
				$(".music_next").trigger("click");
			}
		})


		//监听声音按钮的点击
		$(".music_voice_icon").click(function(argument) {
			// 切换图标
			$(this).toggleClass("music_voice_icon2");
			//声音切换
			if($(this).hasClass("music_voice_icon2")){
				//静音
				player.musicVoiceSeekTo(0);
			}
			else{
				player.musicVoiceSeekTo(1);
			}
		})

		
		//监听收藏按钮点击
		$(".body_toolbar_fav").click(function() {
			var $listCheck = $(".list_music>.list_check");
			if($listCheck.hasClass("list_checked")){
				alert("亚索正在嘤嘤嘤");
			}else{
				alert("请选择操作的单曲");
			}
		});
		//监听添加到按钮点击
		$(".body_toolbar_add").click(function() {
			var $listCheck = $(".list_music>.list_check");
			if($listCheck.hasClass("list_checked")){
				alert("亚索正在嘤嘤嘤");
			}else{
				alert("请选择操作的单曲");
			}
		});
		//监听下载按钮点击
		$(".body_toolbar_down").click(function() {
			var $listCheck = $(".list_music>.list_check");
			if($listCheck.hasClass("list_checked")){
				alert("亚索正在嘤嘤嘤");
			}else{
				alert("请选择操作的单曲");
			}
		});
		//监听删除按钮点击
		$(".body_toolbar_del").click(function() {
			var $listCheck = $(".list_music>.list_check");
			if($listCheck.hasClass("list_checked")){
				for(var i=0;i<$listCheck.length;i++){
					if($listCheck.eq(i).hasClass("list_checked")){
						$listCheck.eq(i).parent(".list_music").find(".list_menu_del").trigger("click");
					}
				}
			}else{
				alert("请选择操作的单曲");
			}
		});
		//监听清空列表按钮点击
		$(".body_toolbar_delAll").click(function() {
			 var flag = confirm("确定要清空列表吗？");
			 if(flag){
			 	$(".list_music").remove();
			 }
		});

		//监听底部播放模式按钮
		var modeIndex = 1;
		$(".foot_in>.music_mode1").click(function() {
			
			$(this).removeClass("music_mode"+modeIndex);
			modeIndex++;
			if(modeIndex>4){
				modeIndex=1;
			}
			$(this).addClass("music_mode"+modeIndex);
		});
		//监听底部纯净模式
		$(".foot_in>.music_only").click(function() {	
			$(this).toggleClass("music_only2");
		});
	}
	//创建一个音乐的函数
	function createMusic(index,ele) {
		var li =$(
			"			<li class=\"list_music\">"+
			"				<div class=\"list_check\"><i></i></div>"+
			"				<div class=\"list_number\">"+(index+1)+"</div>"+
			"				<div class=\"list_name\">"+ele.name+
			"					<div class=\"list_menu\">"+
			"						<a href=\"javascript:;\" title=\"播放\" class='list_menu_play'></a>"+
			"						<a href=\"javascript:;\" title=\"添加\"></a>"+
			"						<a href=\"javascript:;\" title=\"下载\"></a>"+
			"						<a href=\"javascript:;\" title=\"分享\"></a>"+
			"					</div>"+
			"				</div>"+
			"				<div class=\"list_singer\">"+ele.singer+"</div>"+
			"				<div class=\"list_time\">"+
			"					<span>"+ele.time+"</span>"+
			"					<a href=\"javascript:;\" title=\"删除\" class='list_menu_del'></a>"+
			"				</div>"+
			"			</li>");

		li.get(0).index = index;
		li.get(0).ele = ele;
		return li;
	}

	
})